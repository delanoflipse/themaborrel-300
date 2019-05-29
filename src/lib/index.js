'use strict';
import '@babel/polyfill';

const path = require('path');
const express = require('express');
const axios = require('axios');
const app = express();
// const moment = require('moment');
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const { state } = require('../state');

const port = process.argv.length > 2 ? process.argv[2] : 80;
const DIR = process.env.NODE_PATH || path.resolve(path.dirname(''));

// loop query to barkas api
async function interval(context) {
	const { socket } = context;
	let data = null;

	try {
		const res = await axios.get(
			'http://localhost:8123/v1/api/now/bestellingen',
			// 'http://localhost:8123/v1/api/06-03-2019/bestellingen',
			// 'http://localhost:8123/v1/api/08-04-2019/bestellingen',
			{
				timeout: 5000
			}
		);

		data = res.data;
	} catch (e) {}

	if (data) {
		data.orders = data.orders.filter(x => x.tijd >= context.time);
		const event = context.time === 0 ? 'set-initial' : 'update';

		if (event === 'set-initial') {
			state.stats.bole.atk = 0;
			state.stats.bole.def = 0;
		}

		if (data.orders.length) {
			data.orders.forEach(x => {
				if (x.type === 'bier') {
					state.stats.bole.atk += x.bedrag;
				} else {
					state.stats.bole.def += x.bedrag;
				}
			});
			socket.emit(event, data);
			socket.emit('set-bole-stats', state.stats.bole);
		}

		context.time = new Date().getTime();
	} else {
		console.log('failed!');
	}

	if (!context.exit) {
		setTimeout(() => interval(context), 3000);
	}
}

io.on('connection', client => {
	console.log('Socket client connected');
	client.emit('init-state', state);

	const context = {
		socket: client,
		exit: false,
		time: 0
	};

	client.on('register', _ => {
		interval(context);
	});

	client.on('toggle-battle', () => {
		state.battle = !state.battle;
		io.emit('toggle-battle', state.battle);
	});

	client.on('add-spartan', spartan => {
		state.spartans.push(spartan);
		io.emit('add-spartan', spartan);
	});

	client.on('delete-spartan', index => {
		state.spartans.splice(index, 1);
		io.emit('delete-spartan', index);
	});

	client.on('add-spartan-stats', stats => {
		state.stats.spartans.atk += stats.atk;
		state.stats.spartans.def += stats.def;
		io.emit('set-spartan-stats', state.stats.spartans);
	});

	client.on('add-bole-stats', stats => {
		state.stats.bole.atk += stats.atk;
		state.stats.bole.def += stats.def;
		io.emit('set-bole-stats', state.stats.bole);
	});

	client.on('set-spartan-stats', stats => {
		state.stats.spartans = stats;
		io.emit('set-spartan-stats', stats);
	});

	client.on('set-bole-stats', stats => {
		state.stats.bole = stats;
		io.emit('set-bole-stats', stats);
	});

	client.on('set-endtime', x => {
		state.endtime = x;
		io.emit('set-endtime', x);
	});

	client.on('set-message', x => {
		state.message = x;
		io.emit('set-message', x);
	});

	client.on('set-phase', x => {
		state.phase = x;
		io.emit('sync-state', state);
	});

	client.on('reset-phase', _ => {
		state.stats.spartans.atk = 0;
		state.stats.spartans.def = 0;
		state.stats.bole.def = 0;
		state.stats.bole.atk = 0;
		state.phase++;
		state.message = '';
		context.time = new Date().getTime();
		io.emit('sync-state', state);
	});

	client.on('restart', _ => {
		state.stats.spartans.atk = 0;
		state.stats.spartans.def = 0;
		state.stats.bole.def = 0;
		state.stats.bole.atk = 0;
		state.phase = 1;
		state.message = '';
		state.battle = false;
		state.spartans = [];
		context.time = 1;
		io.emit('sync-state', state);
	});

	client.on('reload', _ => {
		io.emit('reload');
	});

	client.on('disconnect', () => {
		context.exit = true;
		console.log('Socket client disconnected');
	});
});

app.use('/', express.static(path.join(DIR, 'frontend')));
app.get('/', (_, res) =>
	res.sendFile(path.join(DIR, 'frontend', 'index.html'))
);
app.get('/admin', (_, res) =>
	res.sendFile(path.join(DIR, 'frontend', 'admin.html'))
);

server.listen(port, () => {
	console.log(`Server started on localhost:${port}`);
});
