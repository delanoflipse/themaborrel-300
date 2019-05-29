import { random, clamp, range } from 'lodash';
import io from 'socket.io-client';
import Vector from './util/Vector';
import Entity from './util/Entity';
import { state } from '../state';
import sync from './util/sync';
import getEl from './util/getEl';

const width = window.innerWidth;
const height = window.innerHeight;
const padding = 100;

const els = {};
getEl('[data-el]', true).forEach(x => (els[x.getAttribute('data-el')] = x));

const bole = [];
const spartans = [];

const socket = io('http://localhost:9090');
socket.emit('register');

const dispatch = {
	addSpartan({ name }, isNew) {
		addEntity(true, name, isNew);
	},
	deleteSpartan(index) {
		const spartan = spartans[index];
		spartan.el.remove();
		spartans.splice(index, 1);
	},
	resetBole() {
		bole.forEach(x => x.el.remove());
		bole.splice(0, bole.length);
	},
	resetAll() {
		spartans.forEach(x => x.el.remove());
		bole.forEach(x => x.el.remove());
		bole.splice(0, bole.length);
		spartans.splice(0, spartans.length);
	},
	setStats(x) {
		if (x) {
			if (x.atk > 0) {
				createStatUpdate(
					x.spartan ? els.spartansatkstats : els.boleatkstats,
					`+${Math.round(x.atk)}`
				);
			}

			if (x.def > 0) {
				createStatUpdate(
					x.spartan ? els.spartansdefstats : els.boledefstats,
					`+${Math.round(x.def)}`
				);
			}
		}
		updateStats();
	},
	reload() {
		window.location.reload();
	},
	toggleBattle() {
		if (!state.battle) {
			bole.forEach(x => genBattlePos(x, battleLine.ymin, battleLine.ymax));
		} else {
			bole.forEach(x => genPos(x));
		}
	},
	addValues(newValues) {
		newValues.orders.forEach(o => {
			range(1, o.aantal).map(x => {
				addEntity(false, o.type.replace(/[ ]/g, ''), false);
			});
		});
	},
	setValues(values) {
		values.orders.forEach(o => {
			range(1, o.aantal).map(x => {
				addEntity(false, o.type.replace(/[ ]/g, ''), false);
			});
		});
	},
	setMessage() {
		updateStats();
	}
};
sync(state, socket, io, dispatch);

const boleField = { xmin: 0, xmax: 0.6, ymin: 0, ymax: 0.99 };
const battleLine = {
	x: 0.7,
	ymin: 0.15 * height,
	ymax: 0.85 * height
};
const spartanField = { xmin: 0.8, xmax: 1, ymin: 0.15, ymax: 0.85 };

function createStatUpdate(container, text, timeout = 5000, cls = 'new-stat') {
	const newel = document.createElement('div');
	newel.classList.add('new-stat');
	newel.innerText = text;
	newel.style.left = random(0, 120) + 'px';
	const el = container;
	el.appendChild(newel);
	setTimeout(_ => newel.remove(), timeout);
}

function diceRoll() {
	return Math.floor(Math.random() * 6) + 1;
}

function updateStats() {
	els.boledefstatsTXT.innerText = `DEF: ${Math.round(state.stats.bole.def)}`;
	els.boleatkstatsTXT.innerText = `ATK: ${Math.round(state.stats.bole.atk)}`;
	els.spartansdefstatsTXT.innerText = `DEF: ${state.stats.spartans.def}`;
	els.spartansatkstatsTXT.innerText = `ATK: ${state.stats.spartans.atk}`;
	els.phase.innerText = `Fase ${state.phase}`;
	els.fight.innerText = state.message;
	els.fight.style.display = state.message === '' ? 'none' : 'block';
}

function genPos(ent, reset) {
	const field = ent.isSpartan ? spartanField : boleField;
	const x = random(field.xmin, field.xmax) * (width - padding * 2) + padding;
	const y = random(field.ymin, field.ymax) * (height - padding * 2) + padding;

	ent.setPos(x, y, reset);
}

function genBattlePos(ent, miny, maxy) {
	if (ent.isSpartan) {
		const field = ent.isSpartan ? spartanField : boleField;
		const fieldrange = (field.xmax - field.xmin) * width;
		const fieldvalue = ent.x - field.xmin * width;
		const fieldfactor = fieldvalue / fieldrange;

		const xfactor = ent.isSpartan ? fieldfactor : 1 - fieldfactor;
		const bx = battleLine.x * width + xfactor * 150 + 25;
		const bym = clamp(ent.y, miny + 50, maxy - 50);
		const by = bym + random(20, -20);

		ent.setBattlePos(bx, by);
	} else if (spartans.length) {
		const targetSpartan = spartans[Math.floor(Math.random() * spartans.length)];
		const target = new Vector(targetSpartan.attackX, targetSpartan.attackY);
		const delta = new Vector(target.x - ent.x, target.y - ent.y).unitVector;
		const r = random(50, 150);
		ent.setBattlePos(target.x - delta.x * r, target.y - delta.y * r);
	}
}

function addEntity(isSpartan, name, isNew = true) {
	const ent = new Entity(isSpartan, name);
	ent.forward = !isSpartan;
	const arr = isSpartan ? spartans : bole;

	arr.push(ent);
	genPos(ent, true);
	if (!isNew) {
		ent.rx = ent.x;
		ent.ry = ent.y;
	}
	genBattlePos(ent, battleLine.ymin, battleLine.ymax);
}

let loop = null;
let battleStart = 0;
function diceLoop() {
	const spartanRollAtk = diceRoll();
	const spartanRollDef = diceRoll();
	const boleRollAtk = diceRoll();
	const boleRollDef = diceRoll();

	// spartan attack
	if (spartanRollAtk > boleRollDef) {
		state.stats.bole.def -= 1;
		createStatUpdate(els.boledefstats, '-1');
	} else {
		state.stats.spartans.atk -= 1;
		createStatUpdate(els.spartansatkstats, '-1');
	}

	// bole attack
	if (boleRollAtk > spartanRollDef) {
		state.stats.spartans.def -= 1;
		createStatUpdate(els.spartansdefstats, '-1');
	} else {
		state.stats.bole.atk -= 1;
		createStatUpdate(els.boleatkstats, '-1');
	}

	// spartans win
	if (state.stats.spartans.atk <= 0 || state.stats.spartans.def <= 0) {
		socket.emit('set-message', 'BoLe winnen!');
		socket.emit('toggle-battle');
		state.battle = false;
	} else if (state.stats.bole.atk <= 0 || state.stats.bole.def <= 0) {
		socket.emit('set-message', 'Spartanen winnen!');
		socket.emit('toggle-battle');
		state.battle = false;
	}

	socket.emit('set-spartan-stats', state.stats.spartans);
	socket.emit('set-bole-stats', state.stats.bole);

	if (state.battle) {
		loop = setTimeout(() => diceLoop(), 1000);
	} else {
		loop = null;
	}
}

function renderEl(x) {
	x.el.style.left = `${x.rx | 0}px`;
	x.el.style.top = `${x.ry | 0}px`;
	x.el.style.zIndex = x.ry | 0;
}

function updateEnt(x) {
	const targetX = state.battle ? x.attackX : x.x;
	const targetY = state.battle ? x.attackY : x.y;

	if (targetX == x.rx && targetY === x.ry) {
		x.updateState(state.battle ? 'combat' : 'idle');
		return;
	}

	const maxSpeed = state.battle ? 2.5 : 1.5;
	x.speed = Math.min(maxSpeed, x.speed + 0.1);

	const delta = new Vector(targetX - x.rx, targetY - x.ry);
	const dist = delta.length;
	if (dist < x.speed * 1.1) {
		x.rx = targetX;
		x.ry = targetY;
		x.speed = 0;
		x.updateState(state.battle ? 'combat' : 'idle');
		return;
	}

	const unit = delta.unitVector.multiply(x.speed);

	x.rx += unit.x;
	x.ry += unit.y;
	x.updateState('walking');
}

function update() {
	bole.forEach(updateEnt);
	spartans.forEach(updateEnt);
	if (state.battle && loop == null) {
		diceLoop();
	}
}

function render() {
	update();
	bole.forEach(renderEl);
	spartans.forEach(renderEl);
	requestAnimationFrame(_ => render());
}

render();
