$.widget("custom.formula", {
     //默认参数
    options: {
        arg: [{
                name: '数据1',
                id: 'f1'
            }, {
                name: '数据2',
                id: 'f2'
            }, {
                name: '数据3',
                id: 'f3'
            }],
        symbol: [{
                name: '加+',
                sign: '+'
            },{
                name: '减-',
                sign: '-'
            }, {
                name: '乘×',
                sign: '*'
            }, {
                name: '除÷',
                sign: '/'
            }, {
                name: '汇总',
                sign: '[sum,'
            }, {
                name: '计数',
                sign: '[count,'
            }, {
                name: '左括号(',
                sign: '('
            }, {
                name: '右括号)',
                sign: ')'
            }],
        addField: {
            addable: true,
            text: '增加常量'
        },
        disp: '' //表达式缓存
    },
    _create: function () { //初始化，控件生命周期内只运行一次
        console.log('组件create')

        var html ='<div class="expr-elements"><div>字段: </div> <ul class="expr-fields"></ul><div class="add-field"></div></div><div class="expr-elements"><div>运算符</div><ul class="expr-symbol"></ul></div><div><div class = "expr-leftop">公式为：<span class="preViewRes"></span></div><ul class="expr-disp"></ul><div class = "expr-error"></div><button class="test">test</button></div>'
        this.element.html(html)
    },
    //创建控件，控件生命周期内会运行多次
    _init: function () { //初始化数据
        console.log('组件init')
        var op = this.options,
            html = '',
            $el = this.element,
            me=this

        console.log(op)
        //加载字段
        $.each(op.arg, function (i, v) {
            html += '<li data-value="' + v.id + '" class="expr-field">' + v.name + '</li>'
        })
        $('.expr-fields', $el).html(html)

        //加载新增字段
        if (op.addField.addable) {
            $('.add-field', $el).html('<input type="number"><button class="add-btn">' + op.addField.text+ '</button>')
        }

        //加载运算符
        html = ''
        $.each(op.symbol, function (i, v) {
            html += '<li data-value = "' +v.sign + '" class = "expr-element" >' + v.name + '</li>'
        })
        $('.expr-symbol', $el).html(html)

        //绑定拖拽点击事件
        this._bindEvent()

        //test按钮
        $('button.test', $el).click(function () {
            var str = me.getFormulaStr()
            $('.preViewRes', $el).html(str)
            var res = me.checkout()
            if (res.result) {
                $('.expr-error', $el).html('')
            }
            else {
                $('.expr-error', $el).html(res.msg)
            }
        })

        //最后加载加载公式
        if (op.disp) {
            console.log(op.disp)
            var h = this._parse(op.disp)
            console.log(h)
            $('.expr-disp', $el).html(this._toHTML(h))
        }
    },
    getFormulaArr:function(){//获取公式数组 Array
        var res = []
        $('.expr-disp li', this.element).each(function (i, v) {
            res.push(v.getAttribute('data-value'))
        })
        return res
    },
    getFormulaStr: function (arr) {
        arr = arr || this.getFormulaArr()
        $.each(arr, function (i, v) {
            if (v == '[sum,') {
                arr.splice(i+2,0,']')
            } else if (v == '[count,') {
                arr.splice(i + 2, 0, ']')
            }
        })
        return arr.join('')
    },
    checkout: function () { //检查公式是否合法 返回布尔型
        var arr = this.getFormulaArr()
        if (arr.length == 0) return {
            result: true,
            msg: ''
        }
        for (var i = 0; i < arr.length; i++){
            if (this._inSymbol(arr[i])) {//运算符
                if (arr[i] == '[count,' || arr[i] == '[sum,') {
                    if (i == arr.length-1) return {
                        result: false,
                        msg: '汇总或者计数后面必须需要一个字段'
                    }
                    if (this._inSymbol(arr[i + 1])) {
                        return { result: false, msg:'汇总或者计数后面只能跟字段'}
                    } else {
                        arr.splice(i, 2, '(',1,')')
                        // if(!this._inSymbol(arr[i+1]))
                    }
                } else if (arr[i] == '+' || arr[i] == '-' || arr[i] == '*' || arr[i] == '/') {
                    arr[i]='+'
                }
            } else {//字段
                if (i + 1 < arr.length) {
                    if (this._inSymbol(arr[i + 1])) {
                        if (arr[i + 1]=='[count,'||arr[i+1]=='[sum,') {
                            return {
                                result: false,
                                msg: '字段后面不能跟汇总或计数'
                            }
                        }
                    } else if (typeof arr[i + 1] == 'number') {

                    } else {
                        return {
                            result: false,
                            msg: '两个字段不能相邻'
                        }
                    }
                }
                arr[i]=1
            }
        }
        try {
            var result = eval(arr.join(''))
        } catch(err){
            return {
                result: false,
                msg: '计算公式不符合运算规则'
            }
        }
        if(typeof result=='number'&&!isNaN(result))
            return {
                result: true,
                msg: ''
            }
    },
    _bindEvent: function () {//绑定拖拽点击事件
        var me = this,
            $el=this.element
        $('.expr-element,.expr-field', $el).draggable({
            revert: "invalid",
            helper: 'clone',
            containment: this.element,
            connectToSortable: '.expr-disp'
        }).disableSelection().click(function (e) {
            $('.expr-disp', $el).append($(this).clone().append('<span class="expr-colse" onclick="$(this).parent().remove()">&times;</span>'))
        })
        $('.expr-disp', $el).empty().sortable({
            cancel: ".expr-colse",
            receive: function (e, ui) {
                ui.helper.append('<span class="expr-colse" onclick="$(this).parent().remove()">&times;</span>')
            }
        })

        //add按钮
        if(this.options.addField.addable)
            $('button.add-btn', $el).click(function () {
                var $input = $(this).prev('input'),
                    val = $input.val()
                    $input.val('')
                if (val) {
                    $('<li data-value = "' + val + '" class = "expr-field" >' + val + '</li>').draggable({
                        revert: "invalid",
                        helper: 'clone',
                        containment: this.element,
                        connectToSortable: '.expr-disp'
                    })
                    .disableSelection()
                    .click(function (e) {
                        $('.expr-disp', this.element).append($(this).clone().append('<span class="expr-colse" onclick="$(this).parent().remove()">&times;</span>'))
                        })
                        .appendTo($('.expr-fields', $el))
                    // me.options.arg.push({name:val,data:val})
                }
            })
    },
    _inSymbol: function (sign) {
        var symbol=this.options.symbol
        for (var i = 0; i < symbol.length; i++){
            var sym = symbol[i]
            if (sym.sign == sign) {
                return true
            }
        }
        return false
    },
    _parse: function (str) {//解析表达式 如 1+2+[sum,e] 解析为参数下标
        var symbol = this.options.symbol

        str = this._parseSymbol(this._parseArg(str))

        str = $.trim(str)
        var arr = str.split(/\s+/)

        return arr
    },
    _toHTML: function (arr) {//下标数组转换为html
        var html='',arg=this.options.arg,symbol=this.options.symbol
        for(var i=0;i<arr.length;i++){
            var v=arr[i]
            if(v[0]=='a'){
                var k=v[1]
                html+='<li data-value="' +arg[k].id + '" class="expr-field">' + arg[k].name + '<span class="expr-colse" onclick="$(this).parent().remove()">×</span></li>'
            }else if(v[0]=='s'){
                var k=v[1]
                html+='<li data-value="'+symbol[k].sign+'" class="expr-element">'+symbol[k].name+'<span class="expr-colse" onclick="$(this).parent().remove()">×</span></li>'
            }else{
                html+='<li data-value="'+v+'" class="expr-field">'+v+'<span class="expr-colse" onclick="$(this).parent().remove()">×</span></li>'
            }
        }
        return html
    },
    _parseArg: function (str) {
        var arg = this.options.arg
        for (var i = 0; i < arg.length; i++) {
            var v = arg[i],
                reg = new RegExp(v.id, 'g')
            if (reg.test(str)) {
                str = str.replace(reg, ' a' + i + ' ')
            }
        }
        console.log('parseArg '+str)
        return str
    },
    _parseSymbol: function (str) {
        var symbol = this.options.symbol
        for (var j = 0; j < symbol.length; j++) {
            var sym = symbol[j],
                reg = new RegExp('\\' + sym.sign, 'g')
            if (reg.test(str)) {
                str = str.replace(reg, ' s' + j + ' ')
                str = str.replace(/]/g, '')
            }
        }

        console.log('parseSym ' + str)
        return str
    }
});