
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
		setItem = function(key, value, cb){
			var v = {};
			v[key] = value;
			chrome.storage.sync.set(v, cb);
		};
		getItem = function(key,cb){
			chrome.storage.sync.get(key, function(item){
				cb( item[key] );
			});
		};
	}else{
		console.log("using localStorage");
		setItem = function(key, value, cb){
			localStorage.setItem(key, value);
			cb();
		};
		getItem = function(key,cb){
			cb(localStorage.getItem(key));
		};
	}
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		var ret = {};
		switch(request.cmd){
		case "SET_AREA":
			setItem("area", request.value, function(){
				ret.status = "OK";
				sendResponse(ret);
			});
			break;
		case "GET_AREA":
			getItem("area",function(value){
				ret.value = value;
				sendResponse(ret);
			});
			break;
		default:
			sendResponse(ret);
		}
	});
}());
