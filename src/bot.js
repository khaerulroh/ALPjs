const LineConnect = require('./connect');
let LINE = require('./main.js');

const auth = {
	authToken: 'Em8GolGz1f2CHTzJjR66.mqy4jOUUhIvI0uMEs6ZW9G.dCl79CQeJu/mL39e4K6EEc/NYzBudjkjkmaQkiOhZqLJc',
	certificate: 'f543cf3185229a2dd4a7e1f12e7958a87c6c534e9d63c993da51ff4d1440513d',
}
let client =  new LineConnect(auth);
//let client =  new LineConnect();

client.startx().then(async (res) => {
	
	while(true) {
		try {
			ops = await client.fetchOps(res.operation.revision);
		} catch(error) {
			console.log('error',error)
		}
		for (let op in ops) {
			if(ops[op].revision.toString() != -1){
				res.operation.revision = ops[op].revision;
				LINE.poll(ops[op])
			}
		}
	}
});
