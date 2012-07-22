var isbn10Dom = $("td.bucket div.content ul li:contains('ISBN-10')").contents();
var isbn13Dom = $("td.bucket div.content ul li:contains('ISBN-13')").contents();
var isbn10,isbn13;

if( isbn10Dom && isbn10Dom.length > 1 ){
	isbn10 = $.trim(isbn10Dom[1].textContent);
}

if( isbn13Dom && isbn13Dom.length > 1 ){
	isbn13 = $.trim(isbn13Dom[1].textContent).replace(/\-/,"");
}

if( isbn10 || isbn13 ){
	$("form#handleBuy>table:eq(2)>tbody>tr:nth-child(8)")
		.after('<tr class="amaruzen-injection">');
	/*
	$.get("http://zaiko.maruzen.co.jp/tenpo_stock/view.asp",{gid:isbn},function(res){
		var $shoplist = $("div.shoplist > span > table", res)
			.appendTo(".amaruzen-injection")
			.wrapAll('<div class="amaruzen-brand"/>')
			.wrap('<div class="amaruzen-store"/>');
		$shoplist.find("a").each(function(){
			$(this).removeAttr("onclick")
				.attr("target","_blank")
				.attr("href", "http://zaiko.maruzen.co.jp/tenpo_stock/"+$(this).attr("href"));
		});
	});*/
	var $junkudo_holder = $("<div>")
		.addClass("amaruzen-brand")
		.appendTo(".amaruzen-injection");
	
	var $junkudo_loading = $("<div>")
		.addClass("amaruzen-brand-loading")
		.text("丸善とジュンク堂書店の在庫を確認中")
		.appendTo($junkudo_holder);
	
	$("<img>")
		.attr("src",chrome.extension.getURL("./res/loader.gif"))
		.attr("id","amaruzen-loading-icon")
		.appendTo($junkudo_loading);
	
	//$junkudo_holder.hide().slideDown();
	
	chrome.extension.sendRequest({"cmd":"GET_AREA"}, function(res){
		var default_selected = null;
		if( res && res.value ){
			default_selected = res.value;
		}
		var isbn = isbn10 || isbn13;
		$.get("http://www.junkudo.co.jp/detail.jsp",{ISBN:isbn},function(res){
			//rewrite "src" attribute of <img> to suppress request from browser
			res = res.replace(/ src=/g,' data-src=');
			var $results = $('div[id^="AreaGroup_"]', res);
	
			if( $results.length == 0 ){
				$junkudo_loading.text("丸善・ジュンク堂店舗に在庫はありません。");
				$("#amaruzen-loading-icon").hide();
			}else{
				$junkudo_loading
					.removeClass("amaruzen-brand-loading")
					.addClass("amaruzen-brand-title")
					.empty();
				
				var $text = $("<span>")
					.addClass("amaruzen-brand-title-text")
					.text("丸善・ジュンク堂の以下の店舗に在庫があります。")
					.appendTo($junkudo_loading);
				
				$("<a>")
					.addClass("amaruzen-detail-link")
					.attr("href", "http://www.junkudo.co.jp/detail.jsp?ISBN="+isbn)
					.attr("target","_blank")
					.text("詳細")
					.appendTo($text);
				
				var $dropdown = $("<select>")
					.attr("name","amaruzen-area-select")
					.attr("id","amaruzen-area-select")
					.change(function(){
						$(".amaruzen-store-area").hide();
						var $area = $("#"+$(this).val());
						if( $area && $area.length > 0 ){
							$area.show();
						}else{
							$(".amaruzen-no-store").show();
						}
						chrome.extension.sendRequest({"cmd":"SET_AREA","value":$(this).val()});
					});
				$dropdown
					.wrap("<span>")
					.parent()
					.prepend("エリアを変更:")
					.addClass("amaruzen-store-areas")
					.appendTo($junkudo_loading);
				
				
				var selected = false;
				$results.each(function(){
					var areaname = $(this).attr("id").substring(10);
					var $area_container = $("<div>")
						.addClass("amaruzen-store-area")
						.attr("id", $(this).attr("id"))
						.appendTo($junkudo_holder)
						.hide();
					
					$("<div>")
						.addClass("amaruzen-store-area-name")
						.text(areaname)
						.prependTo($area_container)
						.hide();
					
					var $area_holder = $("<div>")
						.addClass("amaruzen-store-area-items")
						.appendTo($area_container);
	
					var $opt = $("<option>")
						.val($(this).attr("id"))
						.text(areaname)
						.appendTo($dropdown);
					
					$(this).find("table > tbody > tr > td > div > table > tbody").each(function(){
						var $item = $("<div>").addClass("amaruzen-store");
						
						var $icon = $(this).find("td:nth-child(2) > img");
						var iconsrc = $icon.attr("data-src");
						$icon.attr("src","http://www.junkudo.co.jp/"+iconsrc)
							.wrap("<div>").parent()
							.addClass("amaruzen-store-icon")
							.appendTo($item);
						
						var $name = $(this).find("td:nth-child(3) > font")
							.wrap("<div>").parent()
							.addClass("amaruzen-store-name")
							.appendTo($item);
						$name.find("a").each(function(){
							if( $(this).attr("href").indexOf("http") != 0 ){
								$(this).attr("href","http://www.junkudo.co.jp/"+$(this).attr("href"));
							}
						});
	
						var $bookloc = $(this).find("td:nth-child(4) > font");
						$bookloc
							.wrap("<div>").parent()
							.addClass("amaruzen-store-book-loc")
							.appendTo($item);
						var storename = "";
						iconsrc = iconsrc.substring(iconsrc.lastIndexOf("/")+1);
						switch(iconsrc){
						case "junku16X16.jpg":storename = "ジュンク堂 ";break;
						case "maruzen16X16.jpg":storename = "丸善 ";break;
						case "MJ_16X16.gif":storename = "MARUZEN&ジュンク堂 ";break;
						}
						
						$item.attr("title",storename + $name.text()+" / 店内の場所:"+$bookloc.text());
						$item.appendTo($area_holder);
					});
					if( !selected && $(this).attr("id") == default_selected ){
						$area_container.slideDown();
						$opt.prop("selected","selected");
						$dropdown.change();
						selected = true;
					}
				});
				if( !selected ){
					if( default_selected == null ){
						$dropdown.change();
					}else{
						$("<div>")
							.addClass("amaruzen-store-area amaruzen-no-store")
							.text(default_selected.substring(10) + "に在庫のある店舗はありません。")
							.appendTo($junkudo_holder);
						$("<option>")
							.text(default_selected.substring(10))
							.prop("selected","selected")
							.appendTo($dropdown);
					}
				}
			}
		});
	
	});
}