ECSS = {
	about:'Create by Felipe Pupo\nECSS based in XCSS',
	version:0.4,
	
	decompileSheet:/(([\d\w\s\n,-:*#?@$\[\]%&'"_=+;\\\/]+[\s,]+).+([\s\{]*)([\d\w\s\n-:;\\\/*#?@$%&'"_=+,)(\]]*)\})/img,
	decompileRule:/([\s\b\w.>='"#!#$,%&*\(\)-+:\\\/<\[\]]+)/im,
	decompileParam:/\[([A-z\="'#\d][^\[]+)\]/gim,
	decompileParamTest:/^["'].+["']$/,
	decompileTrim:/^\s+|\s+$/g,
	
	
	//Requisição em ajax (Usado em browsers que nao suporta CSS2)
	xmlhttp:function(){
		try {
		    // Navegadores como Firefox, Opera, Chrome e outros.
		    // (Menos Navegadores Microsoft, ver abaixo)
		    var xmlhttp = new XMLHttpRequest();
		} catch (ee){
		    try{
		        var xmlhttp = new ActiveXObject("Msxml2.XMLHTTP"); // Para Internet Explorer
		    } catch (eee){
		        try{
		            // Também para Internet Explorer,
		            //conforme a versão pode variar o nome do ActiveX Object
		            var xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		        } catch (E) {
		            var xmlhttp = false; // Caso não consiga instanciar o objeto
		        }
		    }
		}
		return xmlhttp;
	},	
	
	//Retorna todos objetos styleSheets da pagina
	styleSheets:function(fn){
		var styleEmbeds = document.getElementsByTagName('*'), 
			styleSheets = [];
		
		for(var x = 0; x < styleEmbeds.length; x++)
		{
			var styleSheet = this.styleSheet(styleEmbeds[x]);
			
			if(styleSheet == 'break') break;
			
			if(styleSheet)
			{
				if(fn)
					fn.call(this,styleSheet,x);
					
				styleSheets.push(styleSheet);					
			}
			
		}
		
		return styleSheets;		
	},
	
	//Retorna objeto styleSheet
	styleSheet:function(styleSheet){
			if(styleSheet.tagName.toUpperCase() == 'LINK' && styleSheet.type == 'text/css')
			{
				
				var newStyleSheet = {
					'sheet'	  :null, 
					'cssText' :null,
					'cssMatch':null
				};
				
				var href 	= styleSheet.href;
				var domain 	= (document.domain != '')?document.domain:'localhost';
				
				// Verifica se tem permissão para leitura
				if ( (href && href.search('file://') != -1) || !((href && href.search('://') != -1) && (href.search(domain) == -1)) )
				{					
					newStyleSheet.sheet = styleSheet.styleSheet || styleSheet.sheet;
					
					if((!newStyleSheet.sheet && (!document.styleSheets || document.styleSheets.length == 0)) || (styleSheet.sheet && styleSheet.sheet.cssRules && styleSheet.sheet.cssRules.length == 0))
					{
						window.onload = function(){
							ECSS.initialize()
						};
						
						if (document.addEventListener)
							document.addEventListener("DOMContentLoaded", window.onload, false);
						
						return 'break';
					}
					
					//APENAS PARA browsers antigos que nao suporta CSS2
					try{
						if(newStyleSheet.sheet.cssText && newStyleSheet.sheet.cssText.search('UNKNOWN') != -1)
						{
							if(typeof(this.xmlhttp) == 'function')	this.xmlhttp = this.xmlhttp();
							
							if(this.xmlhttp)
							{
								
								var callback = function(){
									if (this.xmlhttp.readyState == 4 && this.xmlhttp.status == 200)
							            newStyleSheet.cssText = this.xmlhttp.responseText;
								};
								
								var scope = this;
								
								this.xmlhttp.onreadystatechange = function(){
									callback.apply(scope);
								};
								
								this.xmlhttp.open('GET', href, true);
								this.xmlhttp.setRequestHeader("If-None-­ Match","some-random-string");
								this.xmlhttp.setRequestHeader("Cache-Co­ ntrol","no-cache,max-age=0");
								this.xmlhttp.setRequestHeader('Pragma','no-cache');
								this.xmlhttp.send(null);
							}
							else
								alert('Este browser não da suporte a CSS2 e AJAX');
						}
					}catch(ignore){};
					
				}
			}
			else if(styleSheet.tagName.toUpperCase() == 'STYLE')
			{
				var cssText 	= styleSheet.innerHTML + '';
				
				var newStyleSheet = {
					'sheet'	  :null, 
					'cssText' :null,
					'cssMatch':null
				};
				
				newStyleSheet.sheet 	= styleSheet.styleSheet ? styleSheet.styleSheet : styleSheet.sheet;
				
				//APENAS PARA browsers antigos que nao suporta CSS2
				if(newStyleSheet.sheet.cssText && newStyleSheet.sheet.cssText.search('UNKNOWN') != -1)
					newStyleSheet.cssText = cssText;
					
			}
			
			if(newStyleSheet)
			{
				if(newStyleSheet.cssText)
					newStyleSheet.cssMatch = newStyleSheet.cssText.match(this.decompileSheet);
					
				return newStyleSheet;
			}
			
			return false;
	},
	
	cssRules:function(styleSheet,fn){
		var cssRules 	= styleSheet.sheet.rules || styleSheet.sheet.cssRules;
		var newCssRules = [];
		
		if(cssRules){
			for(var x = 0; x < cssRules.length; x++)
			{
				var cssRule = this.cssRule(cssRules[x], styleSheet, (styleSheet.cssMatch?styleSheet.cssMatch[x]:null) );
				
				if(cssRule)
				{
					if(fn)
						fn.call(this,cssRule,x);
						
					newCssRules.push(cssRule);
				}
			}
		}
		
		return 	newCssRules;		
	},
	
	cssRule:function(cssRule,styleSheet,cssMatch){
						
		if(cssRule.style)
		{
			var selectorText = cssRule.selectorText;
			
			if(cssMatch)
			{
				var replaceRule = cssMatch.match(this.decompileRule);
				
				if(replaceRule)			
					selectorText = selectorText.replace('UNKNOWN',replaceRule[1]);
			}
			
			selectorText = (selectorText) ? selectorText.replace(/^\w+/, function(m){
				return m.toLowerCase();
			}) : null;
			
			if ( !(!selectorText || !new RegExp('ecss').test('^' +selectorText+ '$')) )
			{
				var newCssRule = {'rule':cssRule,'selectorText':selectorText,'parentStyleSheet':styleSheet};
									
				return newCssRule;
			}
			
			return false;
		}
		
	},
	
	createRule:function(afect,newProperts,stSheet){
		if(stSheet.insertRule)
		{
			var newRule = stSheet.insertRule(afect+'{'+newProperts+'}',stSheet.cssRules.length);
		}
		else if(stSheet.addRule)
		{
			var newRule = stSheet.addRule(afect,newProperts);
		}	
	},
	
	//Executa ação da regra
	execute:function(cssRule){
		var rulesText = cssRule.selectorText.split(',');
		var decompileRuleText = new RegExp("(.*)(?:.?ecss.)(" + this.methodsName + ")");

		for(var x = 0; x < rulesText.length; x++)
		{
			var ruleText = rulesText[x].replace(this.decompileTrim,"");
			var rule 	 = ruleText.match(decompileRuleText);
				
			if(rule)
			{
				var method = rule[2], afect = rule[1];
				
				if(this.methods[method])
				{
					var params = ruleText.match(this.decompileParam);
					
					if(params)
					{
						for(var p = 0; p < params.length; p++)
						{
							var param = params[p];
								
							param = param.substring(1, param.length-1);
							param = param.split('=');
							
							if(param[1] && this.decompileParamTest.test(param[1]))
								param[1] = param[1].substring(1, param[1].length-1);
							
							params[p] = param;
						}
						
						this.methods[method].call(this,cssRule,params,afect);
					}
				}
			}
		}
	},
	
	//Converte todos ECSS, executar apenas uma vez;
	initialize: function(){
		//Metodos disponiveis
		this.styleSheets(function(styleSheet){
			this.cssRules(styleSheet,function(cssRule){
				this.execute(cssRule);
			});
		});

	},
	
	//Metodos para executar
	methodsName:'',
	methods:{
		'var':function(cssRule,parans,afect){
			if(!this.temp['vars']) this.temp.vars = {};
			
			for(var vc = 0; vc < parans.length; vc++ )
				this.temp.vars[parans[vc][0]] = parans[vc][1];
		},
		'scope':function(cssRule,parans,afect){
			if(!this.temp['scopes']) this.temp.scopes = {};
			
			for(var vc = 0; vc < parans.length; vc++ )
				this.temp.scopes[parans[vc][0]] = afect;
					
			this.createRule(afect,cssRule.rule.style.cssText,cssRule.parentStyleSheet.sheet);
		},
		'class':function(cssRule,parans,afect){
			if(!this.temp['classes']) this.temp.classes = {};
			
			for(var vc = 0; vc < parans.length; vc++ )
					this.temp.classes[parans[vc][0]] = cssRule;
		},
		'set':function(cssRule,parans,afect){
			if(!(this.temp['vars'] || afect)) return;
			
			var newProperts = cssRule.rule.style.cssText + ';';
				
			for(var vc = 0; vc < parans.length; vc++ )
			{
				if(parans[vc][0] == 'scope' && this.temp.scopes[parans[vc][1]])
					afect = this.temp.scopes[parans[vc][1]] + '' + afect;
				else if(this.temp.vars[parans[vc][1]])
					newProperts += parans[vc][0] + ':' + this.temp.vars[parans[vc][1]] + ';';
			}
			
			this.createRule(afect,newProperts,cssRule.parentStyleSheet.sheet);
		},
		'extend':function(cssRule,parans,afect){
			if(!(this.temp['classes'] || afect)) return;
			
			var newProperts = '';
			
			for(var vc = 0; vc < parans.length; vc++ )
			{
				if(this.temp.classes[parans[vc][0]])
					newProperts += this.temp.classes[parans[vc][0]].rule.style.cssText + ';';
			}
			
			newProperts += cssRule.rule.style.cssText;
			
			this.createRule(afect,newProperts,cssRule.parentStyleSheet.sheet);
		},
		'call': function(cssRule,parans,afect){
			if(parans[0]){
				var fn = window[parans[0][0]];
				var pr = [];
				
				for(var vc = 1; vc < parans.length; vc++ ){
					pr.push(parans[vc][0]);
				}
				
				fn.apply(fn, pr);
			}
		},
		'console': function(cssRule,parans,afect){
			console.info(cssRule);
			console.info(parans);
			console.info(afect);
		}
	},
	
	temp:{}
};

(function(){
	for(var methodName in ECSS.methods) 
		ECSS.methodsName += '|' + methodName;
		ECSS.methodsName = ECSS.methodsName.substring(1, ECSS.methodsName.length);
	
	ECSS.initialize();
})();