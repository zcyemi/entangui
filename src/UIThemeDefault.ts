import { IUITheme } from "./UITheme";
import { UIBaseBuilder } from "./UIBuilder";
import { h, thunk } from 'snabbdom';
import { VNode } from 'snabbdom/vnode';
import { UIEventData, UIDefineData, UIDefineType, UIDrawCmd, UIDrawCmdType } from './UIProtocol';
import toVNode from 'snabbdom/tovnode';
import { appendFile } from 'fs';
import { UIDomElement } from './UIFactory';
import { UIHTMLDepLoader } from "./UIRender";
import { UIVirtualDom } from "./UIVirtualDom";

const DEFAULT_CSS = `
*{
font-family: Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace;
font-size: 14px;
font-weight: 400;
}

::-webkit-scrollbar {
    width: 6px;
    height: 10px;
    background-color: rgb(65,65,65);
  }
::-webkit-scrollbar-thumb {
    background-color: rgb(90, 90, 90);
}

::-webkit-scrollbar-thumb:active{
    background-color: #f4f4f4;
}

::-webkit-scrollbar-thumb:hover{
    background-color: #f4f4f4;
}
  

.active{
color: #f4f4f4;
}

body, html {
margin: 0;
padding: 0;

color: rgb(180, 180, 180);
background-color: rgb(48,48,48);
display: flex;
flex-flow: column;
height: 100%;
-webkit-user-select: none;
-webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    cursor: default;
line-height: 20px;
}

p{
margin: 0px;
}


.table {
top: 23px;
position: absolute;
width: calc(100vw - 141px);
left: 141px;
border-collapse: collapse;
font-size: 12px;
}

.table tr {
height: 20px;
}

.table tr td:not(:first-child) {
color: #808080;
}

.table td:nth-child(3) {
width: 110px;
text-align: right;
padding-right: 30px;
}

.table tr:active td, .table tr.active td {
background: #116CD6 !important;
color: white !important;
}

.table tr.disabled td {
color: #A8A8A8 !important;
}

.table tr.disabled:nth-child(even):active td {
background: #F5F5F5 !important;
}

.table tr.disabled:nth-child(odd):active td {
background: white !important;
}

.table th {
text-align: left;
color: #252525;
background: #F0F0F0;
border-bottom: 1px solid #C0C0C0;
padding: 5px 5px 0px 5px;
font-size: 11px;
}

.table td {
padding-left: 5px;
}

.table td:nth-child(1) {
padding-left: 26px;
font-size: 12px;
}

.table th:after {
position: relative;
content: '';
float: right;
height: 18px;
top: -3px;
}

.table th:not(:last-child):after {
border: 0.5px solid #D8D8D8;
}

.table.alt tr:nth-child(even) {
    background-color: #F5F5F5;
}

/* Path */

.path {
height: 24px;
width: calc(100vw - 151px);
position: absolute;
bottom: 0;
margin-left: 141px;
background-color: linear-gradient(#FDFDFD, #FFFFFF);
border-top: 1px solid #CCCCCC;
padding-left: 10px;
}

.path span {
color: #262626;
position: relative;
bottom: -3px;
font-size: 11px;
background-size: 14px;
margin-left: 15px;
background-position: 0px 3px;
}

.path span:active {
background-color: transparent !important;
}

.path span:not(:last-child):after {
font-family: Ion;
margin-left: 8px;
margin-right: -10px;
content: '\e838';
}


.input-wrap{
display: flex;
padding-left: 5px;
padding-right: 5px;
min-width:50px;
}

.input-wrap > span{
color: rgb(189, 189, 189);
max-width: 200px;
min-width: 75px;
flex:1;
text-overflow:ellipsis;
overflow:hidden;
white-space:nowrap;
line-height:26px;

}

.input-wrap > * {
    box-sizing:border-box;
}

.input-wrap > input{
flex: 4;
width:50px;
padding: 0 5px 0 5px;

}
.input-wrap > button{
max-width: 200px;
overflow: hidden;
white-space: nowrap;
text-overflow: ellipsis;
}

input{
background-color: rgb(65,65,65);
border: 1px solid #292929;
padding: 1px;
margin: 1px;
box-sizing: border-box;
height: 24px;
color: rgb(180, 180, 180);
}
input::placeholder{
color: #C0C0C0;
}

input::-webkit-inner-spin-button {
-webkit-appearance: none;
}
input::-webkit-outer-spin-button {
-webkit-appearance: none;
}

textarea{
background-color: rgb(65,65,65);
border: 1px solid #292929;
padding: 1px;
margin: 1px;
box-sizing: border-box;
color: rgb(180, 180, 180);
min-height: 26px;
}

button{
background: linear-gradient(#484848,#3f3f3f);
border: 1px solid #292929;
height: 22px;
color: rgb(180, 180, 180);
outline: none;
border-radius: 2px;
}

/* button:focus{
border: 1px solid #2c88f1;
} */

button:hover{
background: linear-gradient(#555555,#484848);
color: #858585;
border-color:#858585;
}

button:active{
background: linear-gradient(#404040,#3f3f3f);
color: #5e5e5e;
border-color:#5e5e5e;
}

.alert{
border: 1px solid #aaa;
padding: 2px;
border-radius: 2px;
margin: 4px 2px 4px 2px;
box-sizing: border-box;
}

.alert-primary{
border-color: #2c88f1;
color:#2c88f1;
}

.alert-success{
border-color: #60c525;
color:#60c525;
}

.alert-secondary{
border-color: #999999;
color:#999999;
}

.alert-danger{
border-color: #FC615D;
color:#FC615D;
}

.alert-warning{
border-color: #ec930c;
color:#ec930c;
}

.alert-info{
border-color: #9655ff;
color:#9655ff;
}

.alert-light{
background-color: #f5f5dc77;
color:#ffffff;
}

.alert-dark{
background-color: #333333;
color:#b1b1b1;
}

.btn-primary{
color:#2c8cfa;
}

.btn-secondary{
color:#999999;
}

.btn-success{
color:#60c525;
}

.btn-danger{
color:#FC615D;
}

.btn-warning{
color:#ec930c;
}

.btn-info{
color:#9655ff;
}

.btn-light{
color:#f5f5dc;
}

.btn-outline-primary{
background: none !important;
border-color: #2c88f1;
border: 1px solid #2c88f1;
color:#2c88f1;
}

.btn-outline-danger{
background: none !important;
border: 1px solid #FC615D;
color:#FC615D;
}

.btn-outline-success{
background: none !important;
border: 1px solid #60c525;
color:#60c525;
}

.btn-outline-secondary{
background: none !important;
border: 1px solid #999999;
color:#999999;
}

.btn-outline-warning{
background: none !important;
border: 1px solid #ec930c;
color:#ec930c;
}


.btn-outline-info{
background: none !important;
border: 1px solid #9655ff;
color:#9655ff;
}


.btn-outline-light{
background: none !important;
border: 1px solid #f5f5dc;
color:#f5f5dc;
}

.btn-outline-dark{
background: none !important;
border: 1px solid #999999;
color:#999999;
}



.primary{
color: #2c88f1;
}

.secondary{
color: #999999;
}

.success{
color: #60c525;
}

.danger{
color:#FC615D;
}

.info{
color: #9655ff;
}

.light{
background-color: #f5f5dc;
}

.warning{
color: #ec930c;
}

.sidebar{
display: flex;
background-color: #393939;
border: 1px solid #292929;
flex-direction:column;
}

.sidebar > .heading{
height: 32px;
box-sizing: border-box;
padding: 5px;
border-bottom: 1px solid #202020;
}

.sidebar > .items{
    flex:1;
    overflow-y:auto;
}

.items > .item{
box-sizing: border-box;
padding: 2px 5px 2px 5px;
}

.items > .item:hover{
background-color: #555555;
}

.items > .active{
background-color: #595959;
}

.flex{
display: flex;
}

hr{
height: 0;
border: 0px;
border-top: 1px solid #555;
margin: 4px 2px 4px 2px;
}

.card{
border: 1px solid #292929;
background-color: #393939;
border-radius: 2px 2px 0px 0px !important;
display:flex;
position:relative;
flex-direction:column;
}

.card > .card-header{
border: none;
background-color: #494949;
padding: 2px 4px 2px 4px;
border-bottom: 1px solid #292929;
color: rgb(207, 207, 207);
height: 22px;
width:100%;
box-sizing:border-box;
}

.card > .card-body{
flex:1;
box-sizing: border-box;
border: none;
padding: 2px;
overflow-y:auto;
}

.btn-group{
margin: 2px;
display: flex;
}

.btn-group > button{
background: linear-gradient(#535353,#484848,#3f3f3f);
margin: 0px !important;
border: 0px;
border-top: 1px solid #292929;
border-bottom: 1px solid #292929;
border-radius: 0px;
border-right: 1px solid #292929;
flex: 1;
}


.btn-group > button:first-of-type{
border: 1px solid #292929 !important;
border-radius: 2px 0 0 2px;
}

.btn-group > button:last-of-type{
border-right: 1px solid #292929 !important;
border-radius: 0 2px 2px 0;
}

.btn-group > .active{
background: #595959 !important;
color: rgb(244, 244, 244);
}


.tab > .btn-group{
margin: 0px;
}

.tab{
padding: 0px;
}
.tab > .tab-content{
border: 1px solid #292929;
border-top:0px;
background-color: #383838;
padding: 3px;
box-sizing: border-box;
}

.collapse{
border: 1px solid #292929;
margin: 2px;
}

.collapse > button.btn-collapse{
width: 100%;
border: 0px;
border-bottom: 1px solid #292929;
}


.collapse > div.collapse-content{
padding: 3px;
box-sizing: border-box;
background: #383838;
}

.collapse > button.active{
background: #595959 !important;
}

form{
background: #383838;
border: 1px solid #292929;
margin: 2px;
box-sizing:border-box;
}

div.form-group{
display: flex;
padding-left: 2px;
padding-right: 2px;
margin: 2px 0 2px 0;
overflow:hidden;
position:relative;
}

div.form-group > *{
    box-sizing:border-box;
}

div.form-group > label{
    color: rgb(189, 189, 189);
    max-width: 200px;
    min-width:75px;
    padding-left: 2px;
    flex: 1;
    line-height:26px;
    text-overflow:ellipsis;
    overflow:hidden;
    white-space:nowrap;
}

div.form-group > input{
flex: 4;
width:35px;
padding: 0 5px 0 5px;
}

div.form-group > div.form-input-part{
    flex:4;
    display:flex;
    flex-wrap:wrap;
}

div.form-input-part > input{
    width:55px;
    padding: 0 5px 0 5px;
}

div.form-group > textarea{
flex: 4;
}

div.form-group > select{
flex: 4;
}

select{
background-color: rgb(65,65,65);
border: 1px solid #292929;
padding: 1px;
margin: 1px;
box-sizing: border-box;
height: 20px;
color: rgb(180, 180, 180);
}

.toast{
background: #494949;
border: 1px solid #292929;
border-radius: 3px;
transition: all 0.5s;
right: -100%;
position: relative;
margin: 10px;
}

.toast-on{
right: 20px;
box-shadow: 0px 0px 10px #1f5ea7;
}

.toast > .toast-header{
background: #595959;
border-bottom: 1px solid #292929;
padding: 3px 10px 3px 10px;
color: #f4f4f4;
font-weight: 600;
}

.toast > .toast-body{
padding: 3px 10px 3px 10px;
color:#ddd;
min-height: 40px;
}

#entangui-modalroot{
width: 100%;
height: 100%;
position: fixed;
top:0px;
left:0px;
background: #000000aa;
display: none;
opacity: 0;
z-index:1000;
}

#entangui-toastroot{
    z-index:800;
}

.modal{
background: #494949;
border: 1px solid #292929;
border-radius: 3px;
position: relative;
margin: 20px;
top: 50%;
left:50%;
transform: translate(-50%,-50%);
display: inline-block;
max-width: 95%;
min-width: 200px;
box-sizing: border-box;
box-shadow: 0px 0px 10px #1f5ea7;
}

.modal-header{
border-bottom: 1px solid #292929;
background: #595959;
padding: 3px 10px 3px 10px;
color: #f4f4f4;
font-weight: 600;
}

.modal-body{
padding: 3px 10px 3px 10px;
color:#ddd;
}

.modal-footer{
width: 100%;
text-align: center;
padding: 10px 4px 4px 4px;
box-sizing: border-box;
}

.modal-footer > button{
min-width: 100px;
}

.overlay{
    position:fixed;
    left:50%;
    top:50%;
    transform:translate(-50%,-50%);
}

.mask{
    position:fixed;
    width:100%;
    height:100%;
    top:0;
    left:0;
    background:#000000aa;
    z-index:500;
}

.center{
    position:relative;
    left:50%;
    top:50%;
    transform:translate(-50%,-50%);
    display:inline-block;
}

.maxsize{
    width:100%;
    height:100%;
}

.bandage{
    background:rgb(57,57,57);
    border: 1px solid #292929;
    border-radius:5px;
    padding:0px 5px 0px 5px;
    display:inline-block;
    margin: 1px 3px 1px 3px;
    box-sizing:border-box;
    color:#222;
}

.bandage-primary{
    background:#2c88f1;
}

.bandage-success{
    background: #60c525;
}

.bandage-secondary{
    background:#999999;
}

.bandage-danger{
    background:#FC615D;
}

.bandage-warning{
    background:#ec930c;
}

.bandage-info{
    background:#9655ff;
}

.bandage-light{
    background:#f5f5dc77;
}

.bandage-dark{
    background:#182a64;
    color:#b1b1b1;
}

.bandage-outline-primary{
    color:#2c8cfa;
    border-color:#2c8cfa;
}

.bandage-outline-secondary{
    color:#999999;
    border-color:#999999;
}

.bandage-outline-success{
    color:#60c525;
    border-color:#60c525;
}
.bandage-outline-danger{
    color:#FC615D;
    border-color:#FC615D;
}

.bandage-outline-warning{
    color:#ec930c;
    border-color:#ec930c;
}

.bandage-outline-info{
    color:#9655ff;
    border-color:#9655ff;
}

.bandage-outline-light{
    color:#f5f5dc;
    border-color:#f5f5dc;
}

.bandage-outline-dark{
    color:#b1b1b1;
    border-color:#b1b1b1;
    background:#182a64;
}

.bandage-none{
    color:#b4b4b4;
    border-color:#b4b4b4;
}

.tree{

}


.tree > .tree-head{
    
}

.tree-head > .fa{
    width:10px;
}

.tree-head:hover{
    color:#f4f4f4;
}


.tree > .tree-list{
    margin: 1px 3px 1px 10px;
    display: none;
}

.tree-on{
    display: block !important;
}

input[type="file"]{
    padding-left:2px;
}

input[type="file"]::-webkit-file-upload-button { 
    background:none;
    margin:0px;
    border:0px;
    border-right: 1px solid #292929;
    background: linear-gradient(#484848,#3f3f3f);
    color: rgb(180, 180, 180);
    outline:none !important;
}

`;

export class UIThemeDefault implements IUITheme{
    LoadDepStyleSheet() {
        UIHTMLDepLoader.addCSS('default_theme',DEFAULT_CSS);
    }
    LoadDepScript() {
    }

    GetUIBuilder(eventCallback: (evtdata: UIEventData) => void, virtualDom:UIVirtualDom):UIBaseBuilder{
        return new UIBuilderDefault(eventCallback,virtualDom);
    }
}

class UIBuilderDefault extends UIBaseBuilder{
    public cmdSidebarBegin(options: any) {
        let id = options['id'];
        this.m_paramCache.set('sidebar', id);

        let nav = h('div', {
            class: {
                'sidebar': true,
            },
            id: id,
            style:{
                height: '100vh',
                'box-sizing':'border-box',
            }
        })
        this.pushNode(nav);
        this.beginChildren();

        this.pushNode(h('div', {
            class: {
                'heading':true
            }
        }, options['text']));

        let list = h('div', {
            class: {
                'items': true,
            }
        });

        this.pushNode(list);
        this.beginChildren();
    }

    public cmdSidebarItem(options: any) {
        let id = this.m_paramCache.get('sidebar');
        let key = options['key'];

        let activekey = this.m_paramCache.get(`sidebar#${id}`);
        let item = h('div', {
            class: {
                "item":true,
                'active': activekey == key
            },
            attrs: {
                'href': '#'
            },
            on: {
                click: this.wrapEventDelay(id, 'click',()=>{
                    this.m_paramCache.set(`sidebar#${id}`,key);
                    return key;
                })
            }
        }, options['text']);
        this.pushNode(item);
    }

    public cmdTabBegin(options: any) {
        let id = options.id;
        let tabs: string[] = options.tabs;

        if (tabs == null) return;

        const tabkey = `tabs#${id}`;

        let tabsel =  this.m_paramCache.get(tabkey) || 0;

        this.pushNode(h('div',{
            class:{'tab':true}
        }));
        this.beginChildren();

        let tabroot = h('div', {
            class: this.buildClasses("btn-group"),
            props: { id: id},
        }, []);
        this.pushNode(tabroot);
        this.beginChildren();
        tabs.forEach((tabname, t) => {
            var itemid = `${id}-${t}`;
            var funcClick = this.wrapEventDelay(id, 'click', () => {
                this.m_paramCache.set(tabkey,t);
                return t;
            });
            let tab = h('button', {
                class: t ==tabsel ? this.buildClasses('tab','active') : this.buildClasses('tab'),
                props: {
                    id: itemid,
                    href: '#',
                    type:'button'
                },
                on: {
                    click: funcClick
                }
            }, tabname)
            tabroot.children.push(tab);
        });
        this.endChildren();

        this.pushNode(h('div',{class:{'tab-content':true}}));
        this.beginChildren();
        
    }

    public cmdTabEnd() {
        this.endChildren();
        this.endChildren();
    }
    

    public cmdFormInput(options:any){
        let label = options.label;
        let id = options.id;
        let type = options.type || 'text';
        let finish = options.finish;
        let text = options.text;
        let name = options.name;

        let isDateTime = type == 'datetime';
        this.formGroupBegin(label,id);
        {
            let onEvents = {};
            
            if(!isDateTime){
                onEvents['focusout'] = this.wrapEventDelay(id, 'finish', () => {
                    var val = $(`#${id}`).val();
                    return val;
                });
            }
            else{
                text = text || "2020/1/1 12:00";
            }

            let input = h('input',{
                props:{
                    type:type,
                    id:id,
                    value:text,
                    'autocomplete':'off',
                    name:name
                },
                class:this.buildClasses('form-control'),
                on: onEvents
            });
            this.pushNode(input);

            if(isDateTime){
                setTimeout(()=>{
                    $(`#${id}`)['datetimepicker']({
                        format:'Y/m/d h:m',
                        onChangeDateTime:this.wrapEventDelay(id,"finish",()=>{
                            var val = $(`#${id}`).val();
                            return val;
                        })
                    });
                },100);
            }
            else{
                setTimeout(()=>{
                    $(`#${id}`)['datetimepicker']("disable");
                },100);
            }

        }
        this.formGroupEnd();
    }

    public cmdFormNumber(options:any){
        let label = options.label;
        let id = options.id;
        let type = "number";
        let finish = options.finish;
        let value = options.value || 0;
        this.m_paramCache[id] = value;

        this.formGroupBegin(label);
        {
            let onEvents = {};
            if(finish){
                onEvents['focusout'] = this.wrapEventDelay(id, 'finish', () => {
                    var val:any = $(`#${id}`).val();
                    let pval = Number.parseFloat(val);
                    if(pval === undefined || Number.isNaN(pval)){
                        pval = this.m_paramCache[id];
                        $(`#${id}`).val(pval);
                    }
                    return pval;
                });
            }
            
            let input = h('input',{
                props:{
                    type:type,
                    id:id,
                    value:value,
                    'autocomplete':'off'
                },
                on:onEvents,
                class:this.buildClasses('form-control'),
            });
            this.pushNode(input);
        }
        this.formGroupEnd();
    }

    public cmdFormVec2(options:any){
        let label = options.label;
        let id = options.id;
        let value = options.value;
        let hasevt = options.finish == true;

        value = value || [0,0];
        this.m_paramCache[id] = value;

        this.formGroupBegin(label);
        {
            this.pushNode(h('div',{
                class:{'form-input-part':true}
            }));
            this.beginChildren();
            this.drawFormNumberInputPart(value[0],id,0,hasevt);
            this.drawFormNumberInputPart(value[1],id,1,hasevt);
            this.endChildren();
        }
        this.formGroupEnd();
    }

    public cmdFormVec3(options:any){
        let label = options.label;
        let id = options.id;
        let value = options.value;
        let hasevt = options.finish == true;

        value = value || [0,0,0];
        this.m_paramCache[id] = value;

        this.formGroupBegin(label);
        {
            this.pushNode(h('div',{
                class:{'form-input-part':true}
            }));
            this.beginChildren();
            this.drawFormNumberInputPart(value[0],id,0,hasevt);
            this.drawFormNumberInputPart(value[1],id,1,hasevt);
            this.drawFormNumberInputPart(value[2],id,2,hasevt);
            this.endChildren();
        }
        this.formGroupEnd();
    }

    public cmdFormVec4(options:any){
        let label = options.label;
        let id = options.id;
        let value = options.value;
        let hasevt = options.finish == true;

        value = value || [0,0,0,0];
        this.m_paramCache[id] = value;

        this.formGroupBegin(label);
        {
            this.pushNode(h('div',{
                class:{'form-input-part':true}
            }));
            this.beginChildren();
            this.drawFormNumberInputPart(value[0],id,0,hasevt);
            this.drawFormNumberInputPart(value[1],id,1,hasevt);
            this.drawFormNumberInputPart(value[2],id,2,hasevt);
            this.drawFormNumberInputPart(value[3],id,3,hasevt);
            this.endChildren();
        }
        this.formGroupEnd();
    }

    private drawFormNumberInputPart(val:number,id:string,index:number,evt:boolean){
        var pid = `${id}-${index}`;
        let onEvents = evt? {
            focusout:this.wrapEventDelay(id, 'finish', () => {
            var val:any = $(`#${pid}`).val();
            let vecval = this.m_paramCache[id];
            if(vecval){
                let pval = Number.parseFloat(val);
                if(pval == null || Number.isNaN(pval)){
                    $(`#${pid}`).val(vecval[index]);
                }
                else{
                    vecval[index] = Number.parseFloat(val);
                }
            }
            return vecval;
            })
        }: {};
        let input = h('input',{
            props:{
                type:'number',
                id:pid,
                value:val,
                'autocomplete':'off'
            },
            on:onEvents,
            class:this.buildClasses('form-control'),
        });
        this.pushNode(input);
    }


    public cmdInput(options: any) {
        let label = options['label'];
        let text = options['text'];
        let id = options['id'];
        let finish = options['finish'];

        let btn = options['btn'];
        let click = options['click'];

        let hasBtn = btn != null && click!=null;

        var onEvents = null;
        if (finish) {
            onEvents = {};
            onEvents['focusout'] = this.wrapEventDelay(id, 'finish', () => {
                var val = $(`#${id}`).val();
                return val;
            });
        }
     
        this.pushNode(h('div', {
            class: {
                'input-wrap': true,
            }
        }));
        this.beginChildren();

        if(label !=null){
            this.pushNode(h('span',label));
        }

        this.pushNode(h('input', {
            class: { 'form-control': true },
            props: {
                type: 'text',
                value: text,
                id: id
            },
            on: onEvents
        }));

        if(hasBtn){
            let btnListener:any = {};
            let btnid = `${id}-btn`;
            if(click){
                btnListener.click = this.wrapEvent(btnid,'click');
            }

            this.pushNode(h('button',{
                class:this.buildClasses('btn'),
                props: {
                    type: 'text',
                    id: id+"-btn",
                },
                on:btnListener
            },btn));
        }
        this.endChildren();
    }

    public cmdBeginGroup(options?: any) {
        let padding = "3px";
        if (options && options.padding) {
            padding = options.padding;
        }
        let wrap = h('div', {
            style: this.mergeObject({
                padding: padding,
            },options.style),
            class: this.buildClasses(options && options.classes,'group')
        });
        this.pushNode(wrap);
        this.beginChildren();
    }

    public cmdEndGroup() {
        this.endChildren();
    }

    public cmdFlexBegin(options: any) {
        let flex = h('div', {
            class: {
                'flex': true
            },
            style:options.style
        });
        this.pushNode(flex);
        this.beginChildren();
    }

    public cmdButton(options: any) {
        var listeners: any = {};
        if (options.click) {
            listeners.click = this.wrapEvent(options.id, 'click',this.m_curFormId);
        }

        let rawclasses = options.class || [];
        let theme = options.theme;
        if(theme!=null){
            if(theme != 'none'){
                rawclasses.push(`btn-${theme}`);
            }
            
        }
        else{
            rawclasses.push('btn');
        }
        let classes = this.buildClasses('btn',...(rawclasses));
        let btn = h('button',
            {
                class: classes,
                on: listeners,
                props:{type:'button'},
                style:this.mergeObject({
                    margin: '3px'
                },options.style)
            });
        btn.text = options.text;
        this.pushNode(btn);
    }

    public cmdButtonGroupBegin(options:any){

        this.pushNode(h('div',{
            class:{'btn-group':true}
        }));
        this.beginChildren();
    }

    public cmdButtonGroupEnd(options:any){
        this.cmdEndGroup();
    }


    public cmdCollapseBegin(options:any){
        let id = options.id;
        let title = options.title;
       
        let div = h('div',{
            props:{
                id:id,
            },
            class:this.buildClasses('collapse')
        });
        this.pushNode(div);
        this.beginChildren();

        let collkey = `collapse#${id}`;

        let status = this.m_paramCache.get(collkey);
        if(status == undefined){
            status = 1;
            this.m_paramCache.set(collkey,status);
        }


        var funcClick = this.wrapEventDelay(id, 'click', () => {
            let s = this.m_paramCache.get(collkey);
            let ret = (s +1) %2;
            this.m_paramCache.set(collkey,ret);

            
            let btnitem = $(`div#${id}`).children('.btn-collapse');
            let cnt = $(`div#${id}`).children('.collapse-content');
            if(ret == 1){
                cnt.show();
                btnitem.addClass('active');
            }
            else{
                cnt.hide();
                btnitem.removeClass('active');
            }
            return ret;
        });

        let btn = h('button',{
            class:this.buildClasses('btn-collapse','active'),
            props:{
                type:'button'
            },
            on:{
                click: funcClick
            }
        },title);
        this.pushNode(btn);

        this.pushNode(h('div',{class:{'collapse-content':true}}));
        this.beginChildren();
    }

    public cmdCollapseEnd(){
        this.endChildren();
        this.endChildren();
    }


    public cmdTreeBegin(options:any){
        let label = options.label;
        this.pushNode(h('div',{
            class:{tree:true},
        }));
        this.beginChildren();

        let head_c =[
            h('i',{
                class:{'fa':true,'fa-caret-right':true},
            })
            ,label
        ];
        this.pushNode(h('p',{
            class:{'tree-head':true},
            on:{
                click:(evt:any)=>{
                    let tar:HTMLElement = evt.target;
                    if(tar.tagName == 'I') tar = tar.parentElement;
                    let tarlist = tar.classList;
                    let treelist = tar.parentElement.children[1];
                    let icon = tar.children[0];
                    if(tarlist.contains('active')){
                        tarlist.remove('active');
                        treelist.classList.remove('tree-on');

                        icon.classList.remove('fa-caret-down');
                        icon.classList.add('fa-caret-right');
                    }
                    else{
                        tarlist.add('active');
                        treelist.classList.add('tree-on');

                        icon.classList.add('fa-caret-down');
                        icon.classList.remove('fa-caret-right');
                    }
                }
            }
        },head_c));
        this.pushNode(h('div',{class:{'tree-list':true}}));
        this.beginChildren();

        

    }

    public cmdTreeEnd(){
        this.endChildren();
        this.endChildren();        
    }


    public cmdBandage(options: any) {
        let theme = options.theme || 'none';
        let bandage = h('span', {
            class: this.buildClasses('bandage',`bandage-${theme}`)
        }, options['text']);
        this.pushNode(bandage);
    }

    public actionToast(id: string, options: any) {
        let title = options.title;
        let msg = options.msg;

        $('#entangui-toastroot').append(`
            <div id="${id}" class="toast">
                <div class="toast-header">
                    ${title}
                </div>
                <div class="toast-body">
                    ${msg}
                </div>
            </div>
        `);
        var toastObj: JQuery<HTMLElement> = $(`#${id}`);
        toastObj.addClass('toast-on');

        setTimeout(() => {
            toastObj.removeClass('toast-on');
        }, 2000);
        
        setTimeout(() => {
            toastObj.remove();
        }, 2500);
    }

    public actionNotify(id:string,options:any){
        let root = this.m_modalRoot;
        this.modalRootShow();
        let title = options.title;
        let msg = options.msg;
        let text_confirm = options.text_confirm || "OK";
        let id_btn_ok = `${id}_btn_ok`;

        root.append(`
        <div class="modal" id="${id}">
            <div class="modal-dialog">
                <div class="modal-header">
                    ${title}
                </div>
                <div class="modal-body">
                    ${msg}
                </div>
                <div class="modal-footer">
                    <button type="button" id="${id_btn_ok}" class="btn">${text_confirm}</button>
                </div>
            </div>
        </div>
        `);

        var resultSend = false;
        
        var modalobj: any = $(`#${id}`);
        $(`#${id_btn_ok}`).click(()=>{
            modalobj.remove();
            if(!resultSend){
                this.wrapEvent(id,'finish')(null);
            }
            resultSend = true;
            this.modalRootHide();
        });
    }

    public actionQuery(id:string,options:any){
        const root = this.m_modalRoot;
        let title = options.title;
        let msg = options.msg;

        let text_confirm = options.text_confirm || "Confirm";
        let text_cancel = options.text_cancel || "Cancel";

        let id_btn_ok = `${id}_btn_ok`;
        let id_btn_close = `${id}_btn_close`

        root.append(`
        <div class="modal" id="${id}">
            <div class="modal-dialog">
                <div class="modal-header">
                    ${title}
                </div>
                <div class="modal-body">
                    ${msg}
                </div>
                <div class="modal-footer">
                <button type="button" id="${id_btn_close}">${text_cancel}</button>
                <button type="button" id="${id_btn_ok}">${text_confirm}</button>
                </div>
            </div>
        </div>
        `);

        this.modalRootShow();

        var resultSend = false;

        var modalobj: any = $(`#${id}`);
        $(`#${id_btn_close}`).click(()=>{
            modalobj.remove();
            if(!resultSend){
                this.wrapEvent(id,'result',false)(null);
            }
            resultSend = true;
            this.modalRootHide();
        });
        
        $(`#${id_btn_ok}`).click(()=>{
            modalobj.remove();
            if(!resultSend){
                this.wrapEvent(id,'result',true)(null);
            }
            resultSend = true;
            this.modalRootHide();
        });
    }

    
}