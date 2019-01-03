(function()
{
// This is stolen from https://www.rlvision.com/blog/using-wildcard-matching-in-any-programming-language/
function wildcardMatch(find, source)
{
	find = find.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, "\\$&");
	find = find.replace(/\*/g, ".*");
	find = find.replace(/\?/g, ".");
	var regEx = new RegExp(find, "i");
	return regEx.test(source);
}

function getHostName()
{
	var url = window.location.href;
	if (window.tab && window.tab.url) url = tab.url;
	return url.match(/[^\/]+\/\/[^\/]+/)[0];
}

class InjectedDataStorage
{
	constructor(dataStorage)
	{
		this.dataStorage = dataStorage;
	}

	load()
	{
		let hostName = getHostName();
		return this.dataStorage.loadAllKeys().then(allKeys =>
		{
			for (let key of allKeys)
			{
				if (!wildcardMatch(key, hostName)) continue;
				return this.dataStorage.load(key).then(value => InjectedData.deserialize(value));
			}
			return null;
		})
	}

	save(injectedData)
	{
		this.dataStorage.save(getHostName(), injectedData.serialize())
	}
}

window.InjectedDataStorage = InjectedDataStorage;

})()
