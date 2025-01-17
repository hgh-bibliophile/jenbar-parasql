# jenbar-parasql

## AppScript: Template for Importing Libraries

```js
// JenBar Global Namespace
window.jb = {} // `window` is an explicit reference to the global namespace.
	// Referencing `jb` with `window.jb` and `jb` are equivalent,
	// as are all other properties/methods/variables on the window object.
	// I recommend placing this at the top of AppScripts.

function importLibs() {
	const cdn = {
		styles: [ // CSS strings
			"div.ReportWidget div.DataRow.Selected { background-color: rgba(150,150,150,0.3) !important; }"
		],
		scripts: [ // Links to js libraries. JsDelivr is my preferred CDN.
			// Format: ['URL for script.src' (, 'name of cdn.onLoad[name] function for script.onload')]
			['https://cdn.jsdelivr.net/npm/dayjs@1'], // Dayjs -> used in most apps
			['https://cdn.jsdelivr.net/npm/mg-api-js@2/dist/api.min.js', 'gt_api'], // Geotab
			['https://cdn.jsdelivr.net/gh/hgh-bibliophile/jenbar-parasql@0.1/utils.min.js', 'jb_utils'] // jenbar-parasql script
		],
		links: [ // Links to css files.
			// Format: ['URL for link.href', 'link.rel'] 
			['https://cdn.jsdelivr.net/npm/selectize@0.12.6/dist/css/selectize.min.css', 'stylesheet']
		],
		ico: 'https://img.icons8.com/pulsar-line/48/maintenance-date.png',
		onLoad: { // Defines functions that can be called after the scripts listed above have been loaded.
			gt_api: function() {
				getAuth(dt => {
					const auth = JSON.parse(dt.getValue(0, 'auth_results').getString())
					const isReady = dt.getValue(0, 'auth_status').getBoolean()

					jb.gt.api = new GeotabApi(auth)
					if (!isReady) jb.gt.api.authenticate()
				}) 
			},
			jb_utils: () => utils.apply(window.jb) // All the jenbar-parasql scripts must have an onload function like this.
				// Essentially it adds its "public exports" to the "namespace" (variable) you provide.
				// To make the exports global variables, specify `window` (the global namespace).
		},
	}

	// You'll pretty much always need this. Use to import extra js libraries from a CDN.
	cdn.scripts.forEach((url, i) => {
		const id = 'jb-script-' + i
		if (!document.getElementById(id)) {
			let el = document.createElement('script');
			el.id = id
			el.src = url[0]
			if (url[1]) el.onload = cdn.onLoad[url[1]] 
			document.head.appendChild(el);
		} 
	})

	// Use to import stylesheets (css files) from a CDN.
	// Can be removed if cdn.links is not specified.
	cdn.links.forEach((link, i) => {
		const id = 'jb-link-' + i
		if (!document.getElementById(id)) {
			const el = document.createElement('link');
			el.id = id
			el.href = link[0]
			el.rel = link[1]
			document.head.appendChild(el);
		}
	})

	// Use to dynamically add CSS style blocks (one benefit, applies AFTER the ParaSQL css loads).
	// Can be removed if cdn.styles is not specified. 
	cdn.styles.forEach((text, i) => {
		const id = 'jb-style-' + i
		if (!document.getElementById(id)) {
			let el = document.createElement('style');
			el.id = id
			el.type = "text/css"
			el.innerText = text
			document.head.appendChild(el);
		}
	})

	// Replaces the favicon (browser tab icon)
	$("link[rel*='icon']").attr('href', cdn.ico)

	// Abstracts the SQL call away from the script onLoad function called above.
	function getAuth(cb) {
		parasql.app.execSQL('CALL get_gtApiAuth();', cb)
	}
}

// Called as a function so that all the internal variables and functions aren't exposed to the global namespace. 
importLibs()


// --------------------------------

// Remainder of AppScripts w/ app-specific functions and code.
```

**More examples for importing several jb-psql scripts and/or additional plugins for imported libraries:**

```js
// Within importScripts():
function jb_psql(file, isCombined = false, ver = '0.2') { 
	const baseURL = (!isCombined) ? 'https://cdn.jsdelivr.net/' : ''
	return baseURL + 'gh/hgh-bibliophile/jenbar-parasql@' + ver + '/' + file
}
// Or, if combining js-psql scripts with other libraries in import links is unnecessary:
function jb_psql(file, ver = '0.2') { return 'https://cdn.jsdelivr.net/gh/hgh-bibliophile/jenbar-parasql@' + ver + '/' + file }

// Within cdn.scripts:
...
[jb_psql('utils.min.js'), 'jb_utils'],
[jb_psql('sched.min.js'), 'jb_sched'],
[jb_psql('parts.min.js'), 'jb_parts'],
['https://cdn.jsdelivr.net/combine/npm/dayjs@1,npm/dayjs@1/plugin/isoWeek.js', 'dayjs'],
['https://cdn.jsdelivr.net/combine/npm/@selectize/selectize@0.15.2,' + jb_psql('plugins/selectize.min.js', true), 'selectize'], // See associated onLoad below
...

// Within cdn.onLoad:
...
selectize: () => Selectize.define('blur_on_tab', blur_on_tab),
dayjs: () => dayjs.extend(window.dayjs_plugin_isoWeek),
jb_sched: () => { 
	sched.apply(window.jb)
	window.PayPeriod = window.jb.PayPeriod
},
...

```
