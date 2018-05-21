# TruePixabay
Typescript module to interact with the Pixabay API.

Example usage:

```typescript
import { Client } from 'truepixabay'

const client = new Client({ token: 'YOUR-SUPER-SECRET-TOKEN' })

client.getImages({ q: 'fox' })
	.then(console.log)
	.catch(console.error)
```

```js
const { Client } = require('truepixabay');

const client = new Client({ token: 'YOUR-SUPER-SECRET-TOKEN' })

client.getImages({ q: 'fox' })
	.then(console.log)
	.catch(console.error)
```