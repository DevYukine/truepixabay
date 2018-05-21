import { RequestHandler, Request } from './RequestHandler';
import { VideoResponse, ImageResponse } from './PixabayResponses';
import { ImageQuery, VideoQuery } from './PixabayRequests';
import { baseURL, videoURL } from '../util/Constants';

export interface ClientOptions {
	/**
	 * Acess token for the Pixabay API.
	 * @required
	 */
	token: string;
}

export interface CachedItem {
	timestamp: number;
}

export interface CachedImage extends CachedItem {
	image: ImageResponse;
}

export interface CachedVideo extends CachedItem {
	video: VideoResponse;
}

export class Client {
	private _requestHandler: RequestHandler = new RequestHandler();
	private _imageCache: Map<ImageQuery, CachedImage> = new Map();
	private _videoCache: Map<VideoQuery, CachedVideo> = new Map();
	private _token: string;

	public constructor(options: ClientOptions) {
		this._token = options.token;
	}

	public async getImages(options: ImageQuery): Promise<ImageResponse> {
		const cached = this._imageCache.get(options);

		if (cached) {
			const difference = Date.now() - cached.timestamp;
			if (difference < 864e5) {
				return cached.image;
			}
		}
		options.key = this._token;
		const result = await this._makeRequest({ host: baseURL, query: options, failed: false });

		if (this._isImageResponse(result)) {
			this._imageCache.set(options, { timestamp: Date.now(), image: result });
			return result;
		} else {
			throw new Error('Got Video Response for Image Request');
		}
	}

	public async getVideos(options: VideoQuery): Promise<VideoResponse> {
		const cached = this._videoCache.get(options);

		if (cached) {
			const difference = Date.now() - cached.timestamp;
			if (difference < 864e5) {
				return cached.video;
			}
		}
		options.key = this._token;
		const result = await this._makeRequest({ host: videoURL, query: options, failed: false });

		if (!this._isImageResponse(result)) {
			this._videoCache.set(options, { timestamp: Date.now(), video: result });
			return result;
		} else {
			throw new Error('Got Image Response for Video Request');
		}
	}

	private _isImageResponse(arg: any): arg is ImageResponse {
		return !arg.hits[0].duration;
	}

	private _makeRequest(request: Request): Promise<ImageResponse | VideoResponse> {
		return this._requestHandler.queue(request);
	}
}
