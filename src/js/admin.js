import Vue from 'vue/dist/vue';
import io from 'socket.io-client';
import sync from './util/sync';
import { state } from '../state';

const socket = io('http://localhost:9090');

const dispatch = {};
sync(state, socket, io, dispatch);

const app = new Vue({
	el: '#app',
	data: {
		state,
		input: {
			spartan: '',
			satk: 0,
			sdef: 0,
			batk: 0,
			bdef: 0
		}
	},
	methods: {
		toggleBattle() {
			socket.emit('toggle-battle');
		},
		reload() {
			socket.emit('reload');
		},
		deleteSpartan(index) {
			socket.emit('delete-spartan', index);
		},
		setStats() {
			socket.emit('add-spartan-stats', {
				def: Number(this.input.sdef) || 0,
				atk: Number(this.input.satk) || 0
			});
			this.input.satk = 0;
			this.input.sdef = 0;
		},
		updateBole() {
			socket.emit('add-bole-stats', {
				def: Number(this.input.bdef) || 0,
				atk: Number(this.input.batk) || 0
			});
			this.input.batk = 0;
			this.input.bdef = 0;
		},
		resetStats() {
			socket.emit('set-spartan-stats', {
				def: 0,
				atk: 0
			});
		},
		resetStatsBole() {
			socket.emit('set-bole-stats', {
				def: 0,
				atk: 0
			});
		},
		resetPhase() {
			socket.emit('reset-phase');
		},
		restart() {
			socket.emit('restart');
		},
		setPhase() {
			socket.emit('set-phase', state.phase);
		},
		setMessage() {
			socket.emit('set-message', state.message);
		},
		addSpartan() {
			socket.emit('add-spartan', {
				name: this.input.spartan
			});
			this.input.spartan = '';
		}
	}
});
