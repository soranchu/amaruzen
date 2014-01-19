var VERSION = 0.42;//current minor version
var FORMAT_VERSION = 0.4; //current major version

var isbn10Dom = $("td.bucket div.content ul li:contains('ISBN-10')").contents();
var isbn13Dom = $("td.bucket div.content ul li:contains('ISBN-13')").contents();
var isbn10,isbn13;

if( isbn10Dom && isbn10Dom.length > 1 ){
	isbn10 = $.trim(isbn10Dom[1].textContent);
}

if( isbn13Dom && isbn13Dom.length > 1 ){
	isbn13 = $.trim(isbn13Dom[1].textContent).replace(/\-/,"");
}
var $junkudo_holder;
var $junkudo_header;
var $junkudo_header_text;
var $junkudo_loading;
var firstInit = true;

if( isbn13 || isbn10 ){
	$("form#handleBuy>table:eq(2)>tbody>tr:nth-child(8)")
		.after('<tr class="amaruzen-injection">');

	$junkudo_holder = $("<div>")
		.addClass("amaruzen-brand")
		.appendTo(".amaruzen-injection");
	
	$junkudo_header = $("<div>")
		.addClass("amaruzen-brand-loading")
		.appendTo($junkudo_holder);

	$junkudo_header_text = $("<span>")
		.addClass("amaruzen-brand-title-text")
		.appendTo($junkudo_header)
		.hide();

	
	$junkudo_loading = $("<span>")
		.addClass("amaruzen-brand-title-text")
		.text("丸善とジュンク堂書店の在庫を確認中")
		.appendTo($junkudo_header);
	
	$("<img>")
		.attr("src",chrome.extension.getURL("./res/loader.gif"))
		.attr("id","amaruzen-loading-icon")
		.appendTo($junkudo_loading);
	
	//$junkudo_holder.hide().slideDown();
	
	chrome.extension.sendRequest({"cmd":"GET_DATA"}, function(res){
		var default_selected = null;
		if( res && res.area ){
			default_selected = res.area;
		}
		if( res && res.version && res.version >= FORMAT_VERSION ){
			firstInit = false;
		}
		var isbn = isbn13 || isbn10;
		$.get("http://www.junkudo.co.jp/mj/products/detail.php",{isbn:isbn},function(resDetail){
			//rewrite "src" attribute of <img> to suppress request from browser
			resDetail = resDetail.replace(/ src=/g,' data-src=');

			var productId = $('input[name="product_id"]', resDetail).val();
			var $areas = $('.state-button-group > a[href^="stock.php"].btn',resDetail);
			
			if( productId == null || $.trim(productId).length == 0 ){
				$junkudo_header
					.addClass("amaruzen-brand-loading")
					.removeClass("amaruzen-brand-title");
				$junkudo_loading.hide();
				$junkudo_header_text
					.text("丸善・ジュンク堂に書籍情報がありません。")
					.show();
				return;
			}
			
			var $dropdown = $("<select>")
				.attr("name","amaruzen-area-select")
				.attr("id","amaruzen-area-select")
				.change(function(){
					var newArea = $(this).val();
					chrome.extension.sendRequest({"cmd":"SET_AREA","value":newArea});

					loadStock(productId,newArea,$(this).find(":selected").text());
				});
			$dropdown
				.wrap("<span>")
				.parent()
				.prepend("エリアを変更:")
				.addClass("amaruzen-store-areas")
				.appendTo($junkudo_header)
				.hide();

			var selected = null;
			var $allArea;
			$areas.each(function(){
				var regex = /.*area_id=(\d+)/.exec( $(this).attr("href") );
				var areaId = null;
				if( regex && regex.length > 0 ){
					areaId = regex[1];
				}
				var $opt = $("<option>")
				.val(areaId)
				.text($(this).text())
				.appendTo($dropdown);
				
				if( default_selected == areaId ){
					$opt.prop("selected","selected");
					selected = $opt;
				}
				if( areaId == null ){
					$allArea = $opt;
				}
			});
			if( !selected ){
				$allArea.prop("selected","selected");
				default_selected = null;
				selected = $allArea;
			}
			loadStock(productId, default_selected, selected.text());
		});
	
	});
}

function loadStock(productId, areaId, areaName){
	var params = {product_id:productId};
	if( areaId != null ){
		params.area_id = areaId;
	}else{
		areaId = "0";
	}
	
	$junkudo_header
		.addClass("amaruzen-brand-loading")
		.removeClass("amaruzen-brand-title");
	$junkudo_loading.show();
	$junkudo_header_text.hide();
	//$(".amaruzen-store-areas").hide();
	$(".amaruzen-store-area").remove();

	
	$.get("http://www.junkudo.co.jp/mj/products/stock.php", params, function(res){
		res = res.replace(/ src=/g,' data-src=');
		var $rows = $('.stock_detail tr',res);
		var results = new Array;
		$rows.each(function(idx, row){
			var $store = $("td a:eq(0)", row);
			var $stock = $('td:eq(1)',row);
			var $reserve;// = $("td:eq(2)",row);
			var $location = $("td:eq(2)",row);
			if( $stock.length > 0 ){
				results.push( {store:$store,stock:$.trim($stock.text()),reserve:$reserve,location:$.trim($location.text())} );
			}
		});
		
		if( results.length == 0 ){
			$junkudo_header
				.addClass("amaruzen-brand-loading")
				.removeClass("amaruzen-brand-title");
			$junkudo_loading.hide();
			$junkudo_header_text
				.empty()
				.text( areaName + "の丸善・ジュンク堂店舗に在庫はありません。")
				.show();
			$("<a>")
				.addClass("amaruzen-detail-link")
				.attr("href", "http://www.junkudo.co.jp/mj/products/stock.php?product_id="+productId+"&area_id="+areaId)
				.attr("target","_blank")
				.text("詳細")
				.appendTo($junkudo_header_text);
			$(".amaruzen-store-areas").show();
		}else{
			$junkudo_header
				.removeClass("amaruzen-brand-loading")
				.addClass("amaruzen-brand-title");
			$junkudo_loading.hide();
			$junkudo_header_text
				.empty()
				.text("丸善・ジュンク堂の以下の店舗に在庫があります。")
				.show();
			$("<a>")
				.addClass("amaruzen-detail-link")
				.attr("href", "http://www.junkudo.co.jp/mj/products/stock.php?product_id="+productId+"&area_id="+areaId)
				.attr("target","_blank")
				.text("詳細")
				.appendTo($junkudo_header_text);
			$(".amaruzen-store-areas").show();

			var areaname = "area_name";
			var $area_container = $("<div>")
				.addClass("amaruzen-store-area")
				.attr("id", "area_id")
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

			for( var i = 0; i< results.length; ++i){
				var $item = $("<div>").addClass("amaruzen-store");
				var mj = /\s*(MARUZEN|丸善)?&?(ジュンク堂書店|淳久堂|(?:COMICS)?\sJUNKUDO)?\s*(.*)/.exec(results[i].store.text());
				var $name = $("<a>")
					.text( mj&&mj[3] ? mj[3] :  $.trim(results[i].store.text()) );
				$name
					.wrap("<div>").parent()
					.addClass("amaruzen-store-name")
					.appendTo($item);
				
				var $icon = $("<img>")
					.attr("src", chrome.extension.getURL("./res/shopicon_M.png"))
					.addClass("amaruzen-store-icon")
					.prependTo($name);

				if( mj && mj[1] && mj[2] ){
					$icon.attr("src", chrome.extension.getURL("./res/shopicon_MandJ.png"));
				}else if( mj && mj[1] ){
					$icon.attr("src", chrome.extension.getURL("./res/shopicon_M.png"));
				}else if( mj && mj[2] ){
					$icon.attr("src", chrome.extension.getURL("./res/shopicon_J.png"));
				}

				var storeId = /.*store_id=(\d+).*/.exec(results[i].store.attr("href"));
				if( storeId && storeId.length > 0 ){
					var reserveLink = "http://www.junkudo.co.jp/mj/products/keep_order.php?product_id=" + productId + "&store_id=" + storeId[1];
					$name
						.attr("href",reserveLink )
						.attr("target","_blank")
						.click(function(){
							window.open($(this).attr("href"), '','width=600,height=400'); 
							return false;
						});
					
				}else{
					$name
						.attr("href","http://www.junkudo.co.jp/" + results[i].store.attr("href") )
						.attr("target","_blank");
				}

				
				$item.attr("title",$.trim(results[i].store.text()) + " / 在庫：" + results[i].stock + " / 棚位置：" + results[i].location);
				$item.appendTo($area_holder);
			}
			$area_container.slideDown();
			
			if( firstInit ){
				var $overlay = $("<div>")
					.addClass("amaruzen-overlay")
					.appendTo(".amaruzen-brand")
					.hide()
					.click(function(){
						chrome.extension.sendRequest({"cmd":"SET_VERSION","value":VERSION});
						firstInit = false;
						$(this).slideUp();
					});
				var $overlayInner = $("<div>")
					.addClass("amaruzen-overlay-inner")
					.appendTo($overlay);
				var $overlayBox = $("<div>").addClass("amaruzen-overlay-box")
					.appendTo($overlayInner);
				$("<div>")
					.addClass("overlay-title")
					.text("ようこそ amaruzen へ ")
					.appendTo($overlayBox);
				$("<div>")
					.text("amazon.co.jp上で書籍のページを表示すると、選択したエリアにあるジュンク堂・丸善の店頭在庫のある店舗が表示されます。" +
							"ジュンク堂サイトでログインしていれば、店舗をクリックすると、その場で取り置き依頼をすることができます。")
					.appendTo($overlayBox);
				$("<div>")
					.addClass("overlay-txt-small")
					.text(" version:" + VERSION)
					.appendTo($overlayBox);
				$overlay.fadeIn();
			}

		}
	});

}
