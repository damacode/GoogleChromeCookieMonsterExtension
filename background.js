var stores_table;
var cookies_table;

/**
var monster = new Monster();

function Monster() {

    this.cookies_ = {};

    this.reset = function () {
        this.cookies_ = {};
    }

}
**/

chrome.browserAction.onClicked.addListener(function (tab) {
    var manager_url = chrome.extension.getURL("background.html");
    focusOrCreateTab(manager_url);
});

function focusOrCreateTab(url) {
    chrome.windows.getAll({
        "populate": true
    }, function (windows) {
        var existing_tab = null;
        for (var i in windows) {
            var tabs = windows[i].tabs;
            for (var j in tabs) {
                var tab = tabs[j];
                if (tab.url == url) {
                    existing_tab = tab;
                    break;
                }
            }
        }
        if (existing_tab) {
            chrome.tabs.update(existing_tab.id, {
                "selected": true
            });
        } else {
            chrome.tabs.create({
                "url": url,
                "selected": true
            });
        }
    });
}
document.addEventListener('DOMContentLoaded', on_load);

function on_load() {
    chrome.cookies.getAllCookieStores(processCookieStores);
    stores_table = document.getElementById('stores_table');
    cookies_table = document.getElementById('cookies_table');
    setTimeout(function () {
        location.reload(true)
    }, 60000);
    document.getElementById("refresh").onclick = function () {
        location.reload(true);
    };
    document.getElementById("clear").onclick = function () {

        chrome.browsingData.remove({
            "since": 0
        }, {
            "cookies": true
        }, overlay('Cookies cleared.', 1000));
        location.reload(true);
    };
}

function processCookieStores(cookiestores) {
    var tbody = stores_table.getElementsByTagName("tbody")[0];
    for (var cookiestore in cookiestores) {
        var row = document.createElement("tr");
        row.innerHTML += "<td>" + cookiestores[cookiestore].id + "</td>";
        row.innerHTML += "<td>" + cookiestores[cookiestore].tabIds + "</td>";
        tbody.appendChild(row);
        chrome.cookies.getAll({
            "storeId": cookiestore.id
        }, processCookies);
    }
    stores_table.appendChild(tbody);
}

function processCookies(cookies) {
    var tbody = cookies_table.getElementsByTagName("tbody")[0];
    cookies_table.appendChild(tbody);
    for (var cookie in cookies) {
        var row = document.createElement("tr");
        tbody.appendChild(row);
        var button = document.createElement("input");
        button.setAttribute("type", "button");
        button.setAttribute("class", "delete");
        var buttonid = "button" + cookies[cookie].storeId + cookie;
        button.setAttribute("id", buttonid);
        button.value = "X";
        var col = document.createElement("td");
        col.appendChild(button);
        row.appendChild(col);
        row.innerHTML += "<td>" + processDomain(cookies[cookie].domain) + "</td>";
        row.innerHTML += "<td>" + cookies[cookie].domain + "</td>";
        row.innerHTML += "<td>" + cookies[cookie].name + "</td>";
        row.innerHTML += "<td>" + cookies[cookie].path + "</td>";
        row.innerHTML += "<td>" + cookies[cookie].session + "</td>";
        row.innerHTML += "<td>" + cookies[cookie].secure + "</td>";
        row.innerHTML += "<td>" + cookies[cookie].httpOnly + "</td>";
        row.innerHTML += "<td>" + cookies[cookie].hostOnly + "</td>";
        row.innerHTML += "<td>" + cookies[cookie].storeId + "</td>";
        row.innerHTML += "<td>" + cookies[cookie].expirationDate + "</td>";
        row.innerHTML += "<td class=\"value\">" + cookies[cookie].value + "</td>";
        var secure = cookies[cookie].secure + "";
        var name = cookies[cookie].name + "";
        var path = cookies[cookie].path + "";
        var domain = cookies[cookie].domain + "";
        var storeId = cookies[cookie].storeId + "";
        document.getElementById(buttonid).onclick = (function (a, b, c, d, e) {
            return function () {
                removeCookie(a, b, c, d, e);
            };
        })(secure, name, path, domain, storeId);
    }
}

function processDomain(domain) {
    var pattern = new RegExp("[a-zA-Z]*\.[a-zA-Z]*");
    var result = pattern.exec(reverse(domain));
    /**
	if(domain.charAt(0) == '.'){
		return domain.substring(1,domain.length);
	}
	if(domain.substr(1,4) == 'www.'){
		return domain.substring(4,domain.length);
	}
	**/
    return reverse(result[0]);
}

function reverse(s) {
    return s.split("").reverse().join("");
}

function removeCookie(secure, name, path, domain, storeId) {
    var url = "http" + (secure ? "s" : "") + "://" + domain + path;
    chrome.cookies.remove({
        "url": url,
        "name": name,
        "storeId": storeId
    }, null);
    location.reload(true);
}

function overlay(message, time) {
    var success = document.createElement('div');
    success.classList.add('overlay');
    success.setAttribute('id', 'success');
    success.setAttribute('role', 'alert');
    success.textContent = message;
    document.body.appendChild(success);

    setTimeout(function () {
        success.classList.add('visible');
    }, 10);
    setTimeout(function () {
        success.classList.remove('visible');
    }, time);
}


/**
var cookie_cache = new CookieCache();
var tab_cache = new TabCache();
var cookie_reload_scheduled = false;
var tab_reload_scheduled = false;
var reload = 250;
var enabled = false;

chrome.browserAction.onClicked.addListener(function(tab) {
	var manager_url = chrome.extension.getURL("background.html");
	focusOrCreateTab(manager_url);
});

function focusOrCreateTab(url) {
	chrome.windows.getAll({"populate":true}, function(windows) {
		var existing_tab = null;
		for (var i in windows) {
			var tabs = windows[i].tabs;
			for (var j in tabs) {
				var tab = tabs[j];
				if (tab.url == url) {
					existing_tab = tab;
					break;
				}
			}
		}
		if (existing_tab) {
			chrome.tabs.update(existing_tab.id, {"selected":true});
		} else {
			chrome.tabs.create({"url":url, "selected":true});
		}
	});
}

document.addEventListener('DOMContentLoaded', function() {
	onload();
	select("#enabled").checked = enabled;
	select("#enabled").addEventListener('click',options);
	select('#cookies_remove_button').addEventListener('click', removeAllCookies);
	select('#run_cookie_check').addEventListener('click', checkCookiesEnabled);	  
});

function onload() {
	startListening();
	chrome.cookies.getAll({}, function(cookies) {
		for (var i in cookies) {
			cookie_cache.add(cookies[i]);
		}
		reloadCookieTable();
	});
	chrome.tabs.query({}, function(tabs) {
		for (var i in tabs) {
			tab_cache.add(tabs[i]);
		}
		reloadTabTable();
	});
}

function options() {
	if(select("#enabled").checked){
		enabled = true;
	}else{
		enabled = false;
	}
	checkCookies();
}

function checkCookiesEnabled() {
	var temp = enabled;
	enabled = true;
	checkCookies();
	enabled = temp;
}

function checkCookies() {
	var urls = tab_cache.getAllTabUrls();
	cookie_cache.getDomains().forEach(function(domain){
		var tmp = domain;
		if(domain.charAt(0) == '.'){
			tmp = domain.substr(1);
		} else {		
			if (domain.indexOf("www.") == 0) {
				tmp = domain.substr(4);
			} else{
				if(domain.indexOf(".") != domain.lastIndexOf(".")){
					tmp = domain.substr(domain.indexOf(".")+1);
				}
			}
		}
		var found = 0;
		urls.forEach(function(url){
			if (url.indexOf(tmp) != -1){
				found = 1;
			}
		});
		if(found == 0){
			cookie_cache.getCookies(domain).forEach(function(cookie){
				if(enabled){
					cookie_cache.remove(domain);
					removeCookie(cookie);
				}
			});
		}
	});
}

function scheduleReloadCookieTable() {
  if (!cookie_reload_scheduled) {
    cookie_reload_scheduled = true;
    setTimeout(reloadCookieTable, reload);
  }
}

function scheduleReloadTabTable() {
  if (!tab_reload_scheduled) {
    tab_reload_scheduled = true;
    setTimeout(reloadTabTable, reload);
  }
}

function reloadCookieTable() {
  cookie_reload_scheduled = false;
  var domains = cookie_cache.getDomains();
  debugger;
  select("#cookies_total_count").innerText = domains.length;
  resetCookieTable();
  var table = select("#cookies");
  domains.forEach(function(domain) {
    var cookies = cookie_cache.getCookies(domain);
    var row = table.insertRow(-1);
    row.insertCell(-1).innerText = domain;
    var cell = row.insertCell(-1);
    cell.innerText = cookies.length;
    cell.setAttribute("class", "cookie_count");
    var button = document.createElement("button");
    button.innerText = "delete";
    button.onclick = (function(dom){
      return function() {
        removeCookiesForDomain(dom);
      };
    }(domain));
    var cell = row.insertCell(-1);
    cell.appendChild(button);
    cell.setAttribute("class", "button");
  });
}

function reloadTabTable() {
  tab_reload_scheduled = false;
  var ids = tab_cache.getIds();
  select("#tabs_total_count").innerText = ids.length;
  resetTabTable();
  var table = select("#tabs");
  ids.forEach(function(id) {
    var tabs = tab_cache.getTabs(id);
    var row = table.insertRow(-1);
    row.insertCell(-1).innerText = id;
    var cell = row.insertCell(-1);
    cell.innerText = tabs[0].url;
    cell.setAttribute("class", "tab_count");
  });
}

function resetCookieTable() {
  var table = select("#cookies");
  while (table.rows.length > 1) {
    table.deleteRow(table.rows.length - 1);
  }
}

function resetTabTable() {
  var table = select("#tabs");
  while (table.rows.length > 1) {
    table.deleteRow(table.rows.length - 1);
  }
}

function removeAllCookies() {
  var all_cookies = [];
  cookie_cache.getDomains().forEach(function(domain) {
    cookie_cache.getCookies(domain).forEach(function(cookie) {
      all_cookies.push(cookie);
    });
  });
  cookie_cache.reset();
  var count = all_cookies.length;
  for (var i = 0; i < count; i++) {
    removeCookie(all_cookies[i]);
  }
  chrome.cookies.getAll({}, function(cookies) {
    for (var i in cookies) {
      cookie_cache.add(cookies[i]);
      removeCookie(cookies[i]);
    }
  });
}

function removeCookiesForDomain(domain) {
  cookie_cache.getCookies(domain).forEach(function(cookie) {
    removeCookie(cookie);
  });
}

function removeCookie(cookie) {
  var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
            cookie.path;
  chrome.cookies.remove({"url": url, "name": cookie.name});
}

function startListening() {
  chrome.tabs.onUpdated.addListener(listenerTabUpdated);
  chrome.tabs.onRemoved.addListener(listenerTabRemoved);
  chrome.cookies.onChanged.addListener(listenerCookieChanged);
}

function listenerTabUpdated(tabId, info, tab) {
  tab_cache.remove(tabId);
  tab_cache.add(tab);
  checkCookies();
  scheduleReloadTabTable();
}

function listenerTabRemoved(tabId, info) {
  tab_cache.remove(tabId);
  checkCookies();
  scheduleReloadTabTable();
}

function listenerCookieChanged(info) {
  cookie_cache.remove(info.cookie);
  if (!info.removed) {
    cookie_cache.add(info.cookie);
  }
  checkCookies();
  scheduleReloadCookieTable();
}

function CookieCache() {
  this.cookies_ = {};

  this.reset = function() {
    this.cookies_ = {};
  }

  this.add = function(cookie) {
    var domain = cookie.domain;
    if (!this.cookies_[domain]) {
      this.cookies_[domain] = [];
    }
    this.cookies_[domain].push(cookie);
  };

  this.remove = function(cookie) {
    var domain = cookie.domain;
    if (this.cookies_[domain]) {
      var i = 0;
      while (i < this.cookies_[domain].length) {
        if (cookieMatch(this.cookies_[domain][i], cookie)) {
          this.cookies_[domain].splice(i, 1);
        } else {
          i++;
        }
      }
      if (this.cookies_[domain].length == 0) {
        delete this.cookies_[domain];
      }
    }
  };

  this.getDomains = function() {
    return sortedKeys(this.cookies_);
  }
  
  this.getCookies = function(domain) {
    return this.cookies_[domain];
  };
}

function cookieMatch(c1, c2) {
  return (c1.name == c2.name) && (c1.domain == c2.domain) &&
         (c1.hostOnly == c2.hostOnly) && (c1.path == c2.path) &&
         (c1.secure == c2.secure) && (c1.httpOnly == c2.httpOnly) &&
         (c1.session == c2.session) && (c1.storeId == c2.storeId);
}

function TabCache() {
  this.tabs_ = {};

  this.reset = function() {
    this.tabs_ = {};
  }

  this.add = function(tab) {
    var id = tab.id;
    if (!this.tabs_[id]) {
      this.tabs_[id] = [];
    }
    this.tabs_[id].push(tab);
  };

  this.remove = function(id) {
    if (this.tabs_[id]) {
      delete this.tabs_[id];
    }	
  };
  this.getIds = function() {
    var result = [];
    sortedKeys(this.tabs_).forEach(function(id) {
        result.push(id);
    });
    return result;
  }
  
  this.getAllTabUrls = function() {
    var urls = [];
	for (var id in this.tabs_){
		urls.push(this.tabs_[id][0].url);
	}
    return urls;
  };

  this.getTabs = function(id) {
    return this.tabs_[id];
  };
}

function select(selector) {
	return document.querySelector(selector);
}

function sortedKeys(array) {
	var keys = [];
	for (var i in array) {
		keys.push(i);
	}
	keys.sort();
	return keys;
}
**/