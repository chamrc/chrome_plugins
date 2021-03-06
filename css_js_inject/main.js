(function()
{
	let jsEditor, cssEditor, externalCSSEditor, injectDomainNode;
	let dataStorage = new InjectedDataStorage(new DataStorage());
	let currentInjectionData;

	function initializeEditors()
	{
		externalCSSEditor = ace.edit("external-css-editor");
		externalCSSEditor.setTheme("ace/theme/monokai");

		jsEditor = ace.edit("js-editor");
		jsEditor.setTheme("ace/theme/monokai");
		jsEditor.getSession().setMode("ace/mode/javascript");

		cssEditor = ace.edit("css-editor");
		cssEditor.setTheme("ace/theme/monokai");
		cssEditor.getSession().setMode("ace/mode/css");

		injectDomainNode = document.querySelector("#domain")
	}

	function activateTabSwitch()
	{
		document.querySelector("ul.tabs").addEventListener("click", function(event) {
			if (!event.target.classList.contains("tab")) return;
			let selectedTabEle = event.target;
			Array.prototype.forEach.call(this.querySelectorAll(".tab"), function(tabEle)
			{
				let targetEle = document.getElementById(tabEle.getAttribute("tab-content-id"));
				if (tabEle === selectedTabEle)
				{
					tabEle.classList.add("selected");
					targetEle.style.display = "block";
				}
				else
				{
					tabEle.classList.remove("selected");
					targetEle.style.display = "none";
				}
			});
			if (selectedTabEle.id === "cssTab")
			{
				redrawEditor(cssEditor);
			}
			else if (selectedTabEle.id === "jsTab")
			{
				redrawEditor(jsEditor);
			}
			else
			{
				redrawEditor(externalCSSEditor);
			}
		});	
	}

	function activateAutoSave()
	{
		cssEditor.on("change", function() {
			injectCSS();
			saveEditorContent();
		});
		jsEditor.on("change", function() {
			saveEditorContent();
		});
		externalCSSEditor.on("change", function() {
			saveEditorContent();
		});	
		injectDomainNode.addEventListener("input", function() {
			saveEditorContent();
		});		
	}

	function activateResetButton()
	{
		document.querySelector("#reset-button").addEventListener("click", function()
		{
			injectDomainNode.value = InjectedDataStorage.getCurrentDomain();
			saveEditorContent();
		})
	}

	function redrawEditor(editor)
	{
		editor.resize();
		editor.renderer.updateFull();
		editor.focus();
	}

	document.addEventListener("DOMContentLoaded", function()
	{
		initializeEditors();

		chrome.tabs.query({currentWindow: true, active: true}, function(tabs)
		{
			// Save current tab to get correct url in InjectedDataStorage
			window.tab = tabs[0];
			loadEditorContent().then(() =>
			{
				activateTabSwitch();
				activateAutoSave();
				activateResetButton();
			});
		})
	})

	function loadEditorContent()
	{
		return dataStorage.load().then(function(injectionData)
		{
			if (!injectionData) return;
			jsEditor.setValue(injectionData.jsCode);
			cssEditor.setValue(injectionData.cssCode);
			externalCSSEditor.setValue(injectionData.cssURLs.join("\n"));
			injectDomainNode.value = injectionData.domain;
			currentInjectionData = injectionData;
		});
	}

	function saveEditorContent()
	{
		let newDomain = injectDomainNode.value;
		// If domain is changed, remove data for the old domain
		if (currentInjectionData && currentInjectionData.domain !== newDomain)
		{
			dataStorage.remove(currentInjectionData.domain);
		}
		let injectionData = new InjectedData(
			newDomain,
			cssEditor.getValue(), jsEditor.getValue(), externalCSSEditor.getValue().split(/\s*\n\s*/));
		currentInjectionData = injectionData;
		dataStorage.save(injectionData);
	}

	function injectCSS()
	{
		let value = escapeCode(cssEditor.getValue());
		chrome.tabs.executeScript({
			code: "injectCSS('" + value + "');",
		});
	}

	function escapeCode(code)
	{
		return code.replace(/'/g, "\'").replace(/\r?\n/g, "\\n");
	}
})()
