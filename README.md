创建组件：        $('#container').formula()

调用组件外部方法： $('#container').formula('方法名' , 参数1 , 参数2 , ... )

```
参数：{

		arg：[{
				name:'字段1',
				id:'f1'
			},{
				name:'字段2',
				id:'f2'
			}...],//字段

		symbol:[{
				name:'加+',
				sign:'+'
			},{

			}...],//运算符

		addField: { //增加常量模块的开关
			addable: true,//默认为开
			text: 'button文本'
		},

		disp: '' //表达式缓存，设置后可以初始化表达式内容

		mode: 'default'  // default,equation
	}

外部api:
	getFormulaArr()：     //获得公式数组
	getFormulaStr([arr])：//获得公式字符串 arr参数可以不给，自动调用getFormulaArr
	checkout():           //检查公式 ,返回
								{
									result: false/true,
									msg: ''      //错误信息
								}
	calc(str,o)           //计算str  o为str里的参数对象
	sum()                 //计算所有参数的和

内部api:
	_bindEvent():         //组件init时绑定的拖拽点击事件
	_inSymbol(str):       //判断参数是否在运算符内  返回true/false
	_parse([str]):        //编译参数disp为数组 str参数未给出时，会自动调用getFormulaStr
	_parseArg(str)：      //编译str,返回用参数arg下标('a'+i)替换的字符串
	_parseSymbol(str)：   //编译str,返回用参数symbol下标('s'+i)替换的字符串
	_parseSum(str):       //把[sum,f1,f2,f3...]格式编译成this.sum(f1,f2,f3...)
	_toHTML(arr)：        //把字段和运算符下标数组转换为html  返回字符串类型的html
```