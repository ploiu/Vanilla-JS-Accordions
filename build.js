import { bundle as bundleJs } from '@libs/bundle/ts';
import { transform as lightningCss } from 'lightningcss-wasm';
import { gray, green } from '@std/fmt/colors';

const banner = Deno.readTextFileSync('./LICENSE');

await Promise.all([buildJs(), buildCss()]);
console.info(green('Successfully minified js and css!'));

async function buildJs() {
	const jsUrl = new URL('src/AccordionElement.js', import.meta.url);
	console.info(gray('minifying js'));
	const bundledJs = await bundleJs(jsUrl, { minify: 'basic', banner });
	return Deno.writeTextFile('./build/AccordionElement.min.js', bundledJs);
}

async function buildCss() {
	const cssUrl = new URL('src/accordion.css', import.meta.url);
	console.info(gray('minifying css'));
	const originalCss = await Deno.readTextFile(cssUrl);
	const { code } = lightningCss({
		code: new TextEncoder().encode(originalCss),
		minify: true,
	});
	return Deno.writeTextFile('./build/accordion.min.css', `/*${banner}*/\n${code}`);
}
