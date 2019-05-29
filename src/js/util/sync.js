function dispatchfn(dispatch, fn, ...data) {
	if (dispatch && dispatch[fn]) {
		dispatch[fn](...data);
	}
}

export default function sync(state, socket, io, dispatch) {
	socket.on('sync-state', newstate => {
		for (const key in newstate) {
			state[key] = newstate[key];
		}

		dispatchfn(dispatch, 'resetAll');
		dispatchfn(dispatch, 'setStats');

		if (dispatch && dispatch.addSpartan) {
			state.spartans.forEach(x => dispatch.addSpartan(x, false));
		}
	});

	socket.on('init-state', newstate => {
		for (const key in newstate) {
			state[key] = newstate[key];
		}

		dispatchfn(dispatch, 'resetAll');
		dispatchfn(dispatch, 'setStats');

		if (dispatch && dispatch.addSpartan) {
			state.spartans.forEach(x => dispatch.addSpartan(x, false));
		}
	});

	socket.on('reset-bole', newstate => {
		dispatchfn(dispatch, 'resetBole');
	});

	socket.on('toggle-battle', battle => {
		dispatchfn(dispatch, 'toggleBattle', battle);
		state.battle = battle;
	});

	socket.on('add-spartan', spartan => {
		dispatchfn(dispatch, 'addSpartan', spartan);
		state.spartans.push(spartan);
	});

	socket.on('delete-spartan', index => {
		dispatchfn(dispatch, 'deleteSpartan', index);
		state.spartans.splice(index, 1);
	});

	socket.on('set-spartan-stats', stats => {
		const diff = {
			spartan: true,
			atk: stats.atk - state.stats.spartans.atk,
			def: stats.def - state.stats.spartans.def
		};
		state.stats.spartans = stats;
		dispatchfn(dispatch, 'setStats', diff);
	});

	socket.on('set-bole-stats', stats => {
		const diff = {
			spartan: false,
			atk: stats.atk - state.stats.bole.atk,
			def: stats.def - state.stats.bole.def
		};
		state.stats.bole = stats;
		dispatchfn(dispatch, 'setStats', diff);
	});

	socket.on('reload', stats => {
		dispatchfn(dispatch, 'reload');
	});

	socket.on('set-initial', v => {
		dispatchfn(dispatch, 'setValues', v);
	});

	socket.on('update', v => {
		dispatchfn(dispatch, 'updateValues', v);
	});

	socket.on('set-message', v => {
		state.message = v;
		dispatchfn(dispatch, 'setMessage', v);
	});
}
