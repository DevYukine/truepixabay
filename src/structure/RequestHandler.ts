import { get, head } from 'snekfetch';
import { ImageResponse, VideoResponse } from './PixabayResponses';

export type Request = {
	[key: string]: string | object | boolean;
	host: string;
	query: Query;
	failed: boolean;
};

export type Query = {
	[key: string]: any
};

export type Header = {
	[key: string]: any
};

export type RequestObj = {
	request: Request
	resolve: (result: any) => void,
	reject: (error: Error) => void
};

export class RequestHandler {
	private _busy = false;
	private _queue: Array<RequestObj> = [];
	private _limit = 2500;
	private _remaining = 2500;
	private _resetTime: number | null = null;
	private _clearInterval: NodeJS.Timer | null = null;

	public queue(request: Request): Promise<ImageResponse | VideoResponse> {
		return new Promise((resolve, reject) => {
			this._queue.push({ request, resolve, reject });
			this.execute();
		});
	}

	private async execute(): Promise<any> {
		if (this._busy) return;
		this._busy = true;
		while (this._remaining) {
			const current = this._queue.shift();
			if (!current) return;
			try {
				const { body, headers } = await get(current.request.host)
					.query(current.request.query);

				this._limit = headers['x-ratelimit-limit'];
				this._remaining = headers['x-ratelimit-remaining'];
				this._resetTime = headers['x-ratelimit-reset'] * 1000;

				if (!this._clearInterval && this._resetTime) this._clearInterval = setTimeout(this._reset.bind(this), this._resetTime);

				current.resolve(body);

			} catch (error) {
				if (error.status > 500 && error.status < 600 && !current.request.failed) {
					current.request.failed = true;
					this._queue.push(current);
					continue;
				}
				this._remaining -= 1;
				current.reject(error);
			}
		}
		this._busy = false;
	}

	private _reset(): void {
		this._remaining = this._limit;
		this._clearInterval = null;
		this.execute();
	}
}
