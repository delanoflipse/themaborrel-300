export default function getEl(ctx, many = false) {
	return many ? document.querySelectorAll(ctx) : document.querySelector(ctx);
}
