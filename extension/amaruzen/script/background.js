
(function(){
	var getItem;
	var setItem;
	
	//if current chrome supports chrome.storage.sync, 
	// store localStorage's values into chrome.storage.
	if( chrome.storage && chrome.storage.sync ){
		console.log("using chrome.storage");
		var area = localStorage.getItem("area");
		if( area != undefined ){
			chrome.storage.sync.set({"area":area},function(){
				localStorage.removeItem("area");
			});
		}
		setItem = function(kv, cb){
			chrome.storage.sync.set(kv, cb);
		};
		getItem = function(keys,cb){
			chrome.storage.sync.get(keys, function(items){
				cb( items );
			});
		};
	}else{
		console.log("using localStorage");
		setItem = function(kvs, cb){
			for( var key in kvs ){
				if( kvs.hasOwnProperty(key) ){
					localStorage.setItem(key, kvs[key]);
				}
			}
			cb();
		};
		getItem = function(keys,cb){
			var res = new Array();
			for( var key in keys ){
				if( keys.hasOwnProperty(key) ){
					res[key] = localStorage.getItem(key);
				}
			}
			cb(res);
		};
	}
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		var ret = {};
		switch(request.cmd){
		case "SET_AREA":
			setItem({area:request.value}, function(){
				ret.status = "OK";
				sendResponse(ret);
			});
			break;
		case "SET_VERSION":
			setItem({version:request.value}, function(){
				ret.status = "OK";
				sendResponse(ret);
			});
			break;
		case "GET_DATA":
			getItem(["area","version"],function(value){
				sendResponse(value);
			});
			break;
		default:
			sendResponse(ret);
		}
	});
}());
