$.widget("bangboss.formula", {
     //默认参数
    options: {
        arg: [{
            name: '数据1',
            id: 'f1'
        }],
        symbol: [{
                name: '+',
                sign: '+'
            },{
                name: '-',
                sign: '-'
            }, {
                name: '×',
                sign: '×'
            }, {
                name: '÷',
                sign: '÷'
            }
            // , {
            //     name: '计数',
            //     sign: '[count,'
            // }
            , {
                name: '(',
                sign: '('
            }, {
                name: ')',
                sign: ')'
            }, {
                name: '∑',
                sign: '[sum,'
            }],
        addField: {
            addable: true,
            selector: '.add-field',
            text: '增加常量'  //button上的文字
        },
        disp: '', //表达式缓存
        mode: 'default',  // default,equation
        selector: {
            fields: '.expr-fields',
            field: '.expr-field',
            symbols: '.expr-symbol',
            symbol: '.expr-sign',
            formulaView: '.preViewRes',
            equ: '.expr-equ',
            disp: '.expr-disp',
            err: '.expr-error'
        },
        _:{adderr:[],save:[],saveErr:[]}
    },
    _create: function () { //初始化，控件生命周期内只运行一次
        var op = this.options,
            s = this.options.selector

        var html = '<div class="expr-elements"><div class="formula-text">字段: </div> <ul class="' + s.fields.slice(1) + '"></ul>' + (op.addField.addable ? '<div class="' + op.addField.selector.slice(1) + '"></div>' : '') + '</div><div class="expr-elements"><div class="formula-text">运算符</div><ul class="' + s.symbols.slice(1) + '"></ul></div><div class="formula-bottom"><div class = "expr-leftop formula-text">公式为：<span class="' + s.formulaView.slice(1) + '"></span></div>' + (op.mode == 'default' ? '' : '<ul class="' + s.equ.slice(1) + '"></ul><span class="formula-equ">=</span>') + '<ul class="' + s.disp.slice(1) + '"></ul><div class = "' + s.err.slice(1) + '"></div></div><button class="formula-save">保存</button>'

        this.element.html(html).addClass('formula')
    },
    //创建控件，控件生命周期内会运行多次
    _init: function () { //初始化数据
        var op = this.options,
            html = '',
            $el = this.element,
            me = this,
            s=op.selector
        //加载字段
        $.each(op.arg, function (i, v) {
            html += '<li data-value="' + v.id + '" class="expr-field">' + v.name + '</li>'
        })
        $(s.fields, $el).html(html)

        //加载新增字段
        if (op.addField.addable) {
            $(op.addField.selector, $el).html('<input type="number"><button class="add-btn">' + op.addField.text + '</button>')
        }

        //加载运算符
        html = ''
        $.each(op.symbol, function (i, v) {
            html += '<li data-value = "' +v.sign + '" class = "'+s.symbol.slice(1)+'" >' + v.name + '</li>'
        })
        $(s.symbols, $el).html(html)

        //绑定拖拽点击事件
        this._bindEvent()

        //save按钮
        $('button.formula-save', $el).click(function () {
            var str = me.getFormulaStr()
            // $(s.formulaView, $el).html(str)
            var res = me.checkout()
            if (res.success) {
                // $(s.err, $el).html('')
                $.each(op._.save,function (i,v) { v(str) })
            }
            else {
                // $(s.err, $el).html(res.msg)
                $.each(op._.saveErr, function (i, v) {
                    v(res.msg)
                })
            }
        })

        //最后加载加载公式
        if (op.disp) {
            var h = this._parse(op.disp)
            if (op.mode == 'equation') {
                var o = this._toHTML(h)
                $(s.equ, $el).html(o.equ)
                $(s.disp, $el).html(o.disp)
            } else {
                $(s.disp, $el).html(this._toHTML(h))
            }
        }
    },
    getFormulaArr:function(){//获取公式数组 Array
        var res = [],
            op = this.options,
            s = this.options.selector
        //equation模式
        if (op.mode == 'equation') {
            res.push($(s.equ+' li', this.element).attr('data-value'))
            res.push('=')
        }

        $(s.disp+' li', this.element).each(function (i, v) {
            res.push(v.getAttribute('data-value'))
        })
        return res
    },
    getFormulaStr: function (bool) {//bool为true时 称号和除号都转化为 * / 模式
        arr = this.getFormulaArr()
        $.each(arr, function (i, v) {
            if (v == '[sum,') {
                arr.splice(i + 2, 0, ']')
            }
            if (!bool) {
                if (v == '×') {
                    arr[i]='*'
                } else if (v =='÷'){
                    arr[i]='/'
                }
            }
        })
        return arr.join('')
    },
    checkout: function () { //检查公式是否合法 返回布尔型
        var arr = this.getFormulaArr()
        if (this.options.mode == 'equation') {
            if (arr[0] == undefined || arr[0]=='=') {
                return {
                    success: false,
                    msg: '等式左边必须要有个字段'
                }
            }
            if (this._inSymbol(arr[2])&&arr[2]!="("){
                return{
                    success: false,
                    msg: '等式右边必须以字段、常量或者"（"开始'
                }
            }
            arr.splice(0,2)
        }
        if (arr.length == 0) return {
            result: true,
            msg: '等式右边必须要有个字段'
        }
        for (var i = 0; i < arr.length; i++){
            if (this._inSymbol(arr[i])) {//运算符
                // if (arr[i] == '[count,' || arr[i] == '[sum,') {
                if ( arr[i] == '[sum,') {
                    if (i == arr.length-1) return {
                        success: false,
                        msg: '汇总或者计数后面必须需要一个字段'
                    }
                    if (this._inSymbol(arr[i + 1])) {
                        return { success: false, msg:'汇总或者计数后面只能跟字段'}
                    } else {
                        arr.splice(i, 2, '(',1,')')
                        // if(!this._inSymbol(arr[i+1]))
                    }
                } else if (arr[i] == '+' || arr[i] == '-' || arr[i] == '×' || arr[i] == '÷') {
                    arr[i]='+'
                }
            } else {//字段
                if (i + 1 < arr.length) {
                    if (this._inSymbol(arr[i + 1])) {
                        // if (arr[i + 1]=='[count,'||arr[i+1]=='[sum,') {
                        if (arr[i+1]=='[sum,') {
                            return {
                                success: false,
                                msg: '字段后面不能跟汇总或计数'
                            }
                        }
                    } else if (typeof arr[i + 1] == 'number') {

                    } else {
                        return {
                            success: false,
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
                success: false,
                msg: '计算公式不符合运算规则'
            }
        }
        if(typeof result=='number'&&!isNaN(result))
            return {
                success: true,
                msg: ''
            }
    },
    calc:function(str,o){//str为表达式 o为传入的数据{id1:number,id2:number}
        var res
        //如果是×或÷格式替换
        str = str.replace(/[\*]/g, '×')
        str = str.replace(/[\/]/g, '÷')

        for (var k in o) {
            var reg = new RegExp(k, 'g')
            if (reg.test(str)) {
                str=str.replace(reg,o[k])
            }
        }
        str = this._parseSum(str)
        try {
             res=eval(str)
        } catch (err) {
            throw new Error('亲，您的表达式错误啦')
            return
        }
        return res
    },
    sum: function () {
        var arg = arguments,sum=0
        for (var i = 0; i < arg.length; i++){
            sum+=arg[i]
        }
        return sum
    },
    saveSuccess: function (fn) {
        this.options._.save.push(fn)
    },
    saveError: function (fn) {
        this.options._.saveErr.push(fn)
    },
    _parseSum: function (str) {
        var reg =/\[sum,/g
        if (reg.test(str)) {
            str=str.replace(reg,'this.sum(')
        }
        str = str.replace(/]/g, ')')
        return str
    },
    _bindEvent: function () {//绑定拖拽点击事件
        var me = this,
            $el = this.element,
            op = this.options,
            s = op.selector

        $(s.symbol+','+s.field, $el).draggable({
            revert: "invalid",
            helper: 'clone',
            connectToSortable: s.disp+','+s.equ,
            zIndex:1
        }).disableSelection().click(function (e) {
            var el,
                $me = $(this)

            if ($me.hasClass(s.symbol.slice(1))) {//符号
                if ($me.text() == '∑') {
                    el = $me.clone(false).append('<span class="expr-close" onclick="$(this).parent().remove()">&times;</span>')
                } else {
                    el = $me.clone(false).html($me.attr('data-value') + '<span class="expr-close" onclick="$(this).parent().remove()">&times;</span>')
                }
                    $(s.disp, $el).append(el)
            }else{//字段
                el = $me.clone(false).append('<span class="expr-close" onclick="$(this).parent().remove()">&times;</span>')
                if (op.mode == 'equation') {
                    if ($(s.equ + ' li', $el).length == 0) {
                        $(s.equ, $el).append(el)
                    } else {
                        $(s.disp, $el).append(el)
                    }
                } else {
                        $(s.disp, $el).append(el)
                }
            }

        })
        $(s.disp, $el).empty().sortable({
            cancel: ".expr-close",
            // connectWith: '.expr-equ',
            receive: function (e, ui) {
                var li = ui.helper,text = li.text()

                if (me._inSymbol(text, true) && text != '∑') {
                    li.text(li.attr('data-value')).attr('style', '')
                }
                ui.helper.append('<span class="expr-close" onclick="$(this).parent().remove()">&times;</span>')
            }
        })

        if (op.mode == 'equation') { //等号模式
            $(s.symbol, $el).draggable("option", "connectToSortable", s.disp);
            $(s.equ, $el).empty().sortable({
                cancel: ".expr-close",
                receive: function (e, ui) {
                    if ($('li', this).length>0) {
                        $(this).html(ui.helper.append('<span class="expr-close" onclick="$(this).parent().remove()">&times;</span>'))
                    } else {
                        ui.helper.append('<span class="expr-close" onclick="$(this).parent().remove()">&times;</span>')
                    }
                }
            })
        }

        //add按钮
        if(op.addField.addable)
            $(op.addField.selector+' button.add-btn', $el).click(function () {
                var $input = $(this).prev('input'),
                    val = $input.val()
                    if(!val)return
                $input.val('')
                if (val && !isNaN(val)) {
                    $(s.err, $el).html('')

                    $('<li data-value = "' + val + '" class = "'+s.field.slice(1)+'" >' + val + '</li>').draggable({
                        revert: "invalid",
                        helper: 'clone',
                        containment: this.element,
                        connectToSortable: s.disp
                    })
                    .disableSelection()
                    .click(function (e) {
                        $(s.disp, $el).append($(this).clone().append('<span class="expr-close" onclick="$(this).parent().remove()">&times;</span>'))
                        })
                        .appendTo($(s.fields, $el))
                } else {
                    $(s.err, $el).html('请输入正确的常数')
                    $.each(op._.adderr, function (i,v) {
                        v()
                     })
                }
            })
    },
    addError: function (fn) {
        this.options._.adderr.push(fn)
     },
    _inSymbol: function (str,bool) {
        var symbol = this.options.symbol,
            k=bool?'name':'sign'
        for (var i = 0; i < symbol.length; i++){
                var sym = symbol[i]
                if (sym[k] == str) {
                    return true
                }
        }
        return false
    },
    parse: function (o) {
        var str = o.disp, $dom = o.dom instanceof $?o.dom:$(o.dom), arg = o.ops || this.options.arg, h,op=this.options,mode=o.mode,me=this
            h=this._parse(str,arg)
        if (mode == 'equation') {
            var o = this._toHTML(h, mode, true)
            console.log(o)
            $dom.html('<ul class="expr-equ"></ul><span class="formula-equ">=</span><ul class="expr-disp"></ul>').addClass('formula')
                $('.expr-equ', $dom).html(o.equ)
                $('.expr-disp', $dom).html(o.disp)
            } else {
                $dom.html('<ul class="expr-disp">' + this._toHTML(h, mode,true) + '</ul>').addClass('formula')
            }

    },
    update: function (disp) {
        var op=this.options,h = this._parse(disp),s=op.selector,$el=this.element
        if (op.mode == 'equation') {
            var o = this._toHTML(h)
            $(s.equ, $el).html(o.equ)
            $(s.disp, $el).html(o.disp)
        } else {
            $(s.disp, $el).html(this._toHTML(h))
        }
     },
    _parse: function (str,arg) {//解析表达式 如 1+2+[sum,e] 解析为参数下标
        var symbol = this.options.symbol

        str=str.replace(/[\*]/g,'×')
        str=str.replace(/[\/]/g,'÷')

        str = this._parseSymbol(this._parseArg(str,arg))

        str = str.replace(/=/g, ' = ')

        str = $.trim(str)
        var arr = str.split(/\s+/)

        return arr
    },
    _toHTML: function (arr1,mode,bool) {//下标数组转换为html, 数组，模式，有无右上角的叉叉
        var arr=this._doit(arr1,bool),mode=mode||this.options.mode
        if (mode == 'equation') {
            var i = $.inArray('=', arr)
            if (i == 0) {
                return {
                    equ: '',
                    disp:arr.slice(1).join('')
                }
            } else if (i == 1) {
                return {
                    equ: arr[0],
                    disp: arr.slice(2).join('')
                }

            } else if(i==-1){
                return {
                    equ: '',
                    disp: arr.join('')
                }
            } else {
                throw('在等式模式下，请给出正确的等式参数')
            }

        } else {
            var i = $.inArray('=', arr)
            if (i == -1) {
                return arr.join('')
            } else {
                return arr.slice(i + 1).join('')
            }
        }
    },
    _doit: function (arr,bool) {
        var op = this.options,
            arg = op.arg,
            symbol = op.symbol,
            s = op.selector
        for (var i = 0; i < arr.length; i++) {
            var v = arr[i]
            if (v[0] == 'A') {
                var k = v[1]
                if (bool) {
                    arr[i] = '<li data-value="' + arg[k].id + '" class="' + s.field.slice(1) + '">' + arg[k].name + '</li>'
                 } else {
                    arr[i] = '<li data-value="' + arg[k].id + '" class="' + s.field.slice(1) + '">' + arg[k].name + '<span class="expr-close" onclick="$(this).parent().remove()">×</span></li>'
                }
            } else if (v[0] == 'S') {
                var k = v[1]
                if (bool) {
                    arr[i] = '<li data-value="' + symbol[k].sign + '" class="' + s.symbol.slice(1) + '">' + (symbol[k].sign == '[sum,' ? '∑' : symbol[k].sign) + '</li>'
                } else {
                    arr[i] = '<li data-value="' + symbol[k].sign + '" class="' + s.symbol.slice(1) + '">' + (symbol[k].sign == '[sum,' ? '∑' : symbol[k].sign) + '<span class="expr-close" onclick="$(this).parent().remove()">×</span></li>'
                }
            } else if (v != '=') {
                if (bool){
                arr[i]= '<li data-value="'+v+'" class="'+s.field.slice(1)+'">'+v+'</li>'
                } else {
                arr[i]= '<li data-value="'+v+'" class="'+s.field.slice(1)+'">'+v+'<span class="expr-close" onclick="$(this).parent().remove()">×</span></li>'
                }
            }
        }
        return arr
    },
    _parseArg: function (str,arg) {
        var arg = arg || this.options.arg
        for (var i = 0; i < arg.length; i++) {
                var v = arg[i],
                    reg = new RegExp(v.id+'\\b', 'g')
                if (reg.test(str)) {
                    str = str.replace(reg, ' A' + i + ' ')
                }
            }
        return str
    },
    _parseSymbol: function (str) {
        var symbol = this.options.symbol
        for (var j = 0; j < symbol.length; j++) {
            var sym = symbol[j],
                reg = new RegExp('\\' + sym.sign, 'g')
            if (reg.test(str)) {
                str = str.replace(reg, ' S' + j + ' ')
                str = str.replace(/]/g, '')
            }
        }

        return str
    }
});