import { UIContainer } from "../UIContainer";
import { UIRenderer } from "../UIRender";
import { UISourceLocal } from "../UISourceLocal";
import { UIRenderingBind } from "../UISource";
import { UITheme, UIDefineType } from "../UIProtocol";
import { h } from "snabbdom";

import {UIFactory} from '../UIFactory';

enum SampleGroup {
    Input,
    Buttons,
    Tabs,
    Collapse,
    Form,
    Actions,
    Alert,
    Dynamic,
    Defines,
    Scripts,
    JSX,
}

export class SampleUI extends UIContainer {
    private m_groupId: string;
    private m_groupMap: string[] = [];
    public constructor() {
        super();

        for (const key in SampleGroup) {
            if (SampleGroup.hasOwnProperty(key)) {
                const element = SampleGroup[key];
                if ((typeof element == 'number')) {
                    this.m_groupMap.push(key);
                }
            }
        }
    }

    protected OnGUI() {
        this.flexBegin();
        this.FlexItemBegin('250px');
        this.drawNavBar();
        this.flexItemEnd();

        this.FlexItemBegin(null,1);

        this.drawContent();
        this.flexItemEnd();

        this.flexEnd();
    }

    private drawNavBar() {
        this.sidebarBegin('menubar', 'DebugTool', (item) => { this.m_groupId = item });

        this.m_groupMap.forEach(item => {
            this.sidebarItem(item, item);
        })
        this.sidebarEnd();
    }

    private drawContent() {
        if (!this.m_groupId) return;

        let funcName = `sample${this.m_groupId}`;
        let func: Function = this[funcName];
        if (!func) return;

        this.beginGroup();
        func.call(this);
        this.endGroup();
    }

    private m_inputA:string;
    private m_inputB:string;

    private sampleInput() {
        this.input('InputA', this.m_inputA,(val)=>{
            this.m_inputA =val;
        });
        this.input('InputB', this.m_inputB,(val)=>{
            this.m_inputB = val;
        });

        this.inputComplex('InputComplex',this.m_inputA,"Clear Content",val=>this.m_inputA= val,()=>{
            console.log("clear");
            this.m_inputA = "";
        })
    }


    private m_btnThemes:string[] = [
        'primary',
        'secondary',
        'success',
        'danger',
        'warning',
        'info',
        'light',
        'dark',
        'outline-primary',
        'outline-secondary',
        'outline-success',
        'outline-danger',
        'outline-warning',
        'outline-info',
        'outline-light',
        'outline-dark',
        'none',
    ];

    private sampleButtons() {
        this.button('show toast',()=>{

            this.actionToast('Test Toast','hello world');
        })
        this.divider();

        this.m_btnThemes.forEach(theme=>{
            this.button(`Btn-${theme}`,null).theme(theme);
        })

        this.divider();

        const btnwidth:string[] = [
            '100px',
            '200px',
            '50vw',
            '75%'
        ]

        btnwidth.forEach(w=>{
            this.button(w).style({
                width:w
            });
        });

        this.divider();
    }

    private m_tabInd:number = 0;
    private sampleTabs(){
        this.tabBegin(['TabA','TabB','TabC'],ind=>this.m_tabInd = ind);
        this.text('select tab:' + this.m_tabInd);
    }

    private sampleCollapse(){
        this.collapseBegin('Test Collapse');

        this.beginGroup();
        this.text('text in collapse');

        this.endGroup();

        this.collapseEnd();

        this.collapseBegin('Test Collapse 2');

        this.text('text in collapse','h4');
        this.text('text in collapse');
        this.divider();

        this.text('text in collapse','h2');

        this.collapseEnd();
    }


    private m_formInputEmail:string = "test@coconut.is";
    private m_formInputDateTime:string = null;
    private sampleForm(){
        this.beginGroup();
        this.formBegin();
        this.formInput("Email",this.m_formInputEmail,"email",(val)=>{
            this.m_formInputEmail = val;
        })

        this.button("exec");
        this.formInput("Password","123",'password');
        this.formInput("Text","123",'text');
        this.formInput("number","123",'number');

        this.formInput("Date",this.m_formInputDateTime,"datetime",val=>{
            console.log(val);
            this.m_formInputDateTime = val;
        });

        this.formTextArea("Json","{}",5,val=>console.log(val));

        this.formSelect('Select',{
            AAAA:"AAAA",
            BBBB:'BBBB',
            CCCC:'CCCC',
        },(sel)=>{
            this.actionToast('Select',"you selection: "+ sel);
        })

        this.formEnd();
        this.endGroup();
    }


    private m_actToastMsg:string = "test msg";
    private m_actQueryData:any = {
        text_cancel:'No',
        text_confirm:'Yes',
        msg:'React is better than Vue?',
        title:'Question'
    }

    private m_actNotifyData:any = {
        title:"Notify",
        msg:"message",
        text_confirm:"OK"
    };

    private sampleActions(){
        this.input('Toast Message',this.m_actToastMsg,(val)=>this.m_actToastMsg = val);
        this.button('Show Toast',()=>{
            this.actionToast('Test Toast',this.m_actToastMsg);
        });

        this.divider();

        this.input('Query Title',this.m_actQueryData.title,val=>this.m_actQueryData.title = val);
        this.input('Query Msg',this.m_actQueryData.msg,val=>this.m_actQueryData.msg = val);
        this.input('Query Text Confirm',this.m_actQueryData.text_confirm,val=>this.m_actQueryData.text_confirm = val);
        this.input('Query Text Cancel',this.m_actQueryData.text_cancel,val=>this.m_actQueryData.text_cancel = val);
        
        this.button("Show Query",()=>{
            let querydata = this.m_actQueryData;
            this.actionQuery(querydata.title,querydata.msg,(res)=>{
                console.log("query result:" + res);
            },querydata.text_confirm,querydata.text_cancel);
        })

        this.divider();

        this.input('Notify Title',this.m_actNotifyData.title,val=>this.m_actNotifyData.title = val);
        this.input('Notify Msg',this.m_actNotifyData.msg,val=>this.m_actNotifyData.msg = val);
        this.input('Notify Text Confirm',this.m_actNotifyData.text_confirm,val=>this.m_actNotifyData.text_confirm = val);

        this.button("Show Notify",()=>{
            let data = this.m_actNotifyData;
            this.actionNotify(data.title,data.msg,()=>{
                this.actionToast("Info","notify closed");
            },data.text_confirm);
        })
    }

    private sampleAlert(){
        for (const key in UITheme) {
            if (UITheme.hasOwnProperty(key)) {
                const element = UITheme[key];
                if(typeof element === 'number') continue;
                this.alert(`Alert with theme: ${element}`).theme(UITheme[element]);
            }
        }
    }

    private sampleDynamic(){

        this.text("Element");

        this.element("div","Element with style").style({
            width:'200px',
            height:'25px',
            'background-color':'#FF0033',
        });


        this.divider();

        this.element("div","Element With Event").on('click',()=>{
            console.log('click custom div');
        })

        this.divider();

        this.element('div',"div with id").id('test-id');

        this.divider();

        this.element('div',"div with attr").attrs({
            "data-pp":'xxxx'
        });

        this.divider();

        this.text("Element with Children");

        this.element('div').style({
            "background-color":'#777'            
        });
        this.beginChildren();
        this.element('button',"Clickme");
        this.element('p',"some text here");
        this.endChildren();

        this.divider();

        this.text('HTML');

        this.html(`
        <div class="border rounded bg-success text-white">
        <span style="flex:1">测试成功</span><i class="fa fa-check-circle fa-lg"></i>
        </div>
        `).style({
            padding:'4px',
            display:'flex',
            'align-items':'center',
            margin:'3px'
        });

        this.html(`
        <div class="border-2 rounded bg-danger text-white">
        <span style="flex:1">测试失败</span><i class="fa fa-exclamation-circle fa-lg"></i>
        </div>
        `).style({
            padding:'3px',
            display:'flex',
            'align-items':'center',
            margin:'3px'
        });

        this.html(`
        <div class="border rounded bg-warning text-white">
        <span style="flex:1">测试中...</span><i class="fa fa-circle-o-notch fa-spin fa-lg"></i>
        </div>
        `).style({
            padding:'3px',
            display:'flex',
            'align-items':'center',
            margin:'3px'
        });
    }

    private m_btnStyle:boolean = false;

    private sampleDefines(){
        this.button("button with class",()=>{
            this.m_btnStyle = !this.m_btnStyle;
            this.define(UIDefineType.style,".dynamic-style",this.m_btnStyle?{
                "position":"relative",
                "left":"100px",
                "transition": "all 1s"
            }:{
                "position":"relative",
                "left":"0px",
                "transition": "all 1s"
            });
        }).classes("dynamic-style");

        this.divider();
    }

    private sampleScripts(){
        this.button("eval alert",()=>{
            this.evaluate("alert('hello world')");
        });

        this.divider();

        this.button("do calculation 10+20",async ()=>{
            let result = await this.evaluateRet(`
                function testadd(a,b){return a+b;};
                testadd(10,20);
            `);
            this.evaluate(`alert('${result}')`);
        })

        this.divider();

        this.define(UIDefineType.script,"predef sin",`
            function defsin(a){return Math.sin(a);};
        `);
        this.button("call defsin() with 10",async ()=>{
            let ret = await this.evaluateRet('defsin(10)');
            this.evaluate(`alert(${ret})`);
        });
    }

    private sampleJSX(){
        var x = "test";
        this.jsx((
            <div id={x}>
                <h>hello world: {x}</h>
            </div>
        ));

    }
}


export function InitSample(){
    var render = new UIRenderer(document.getElementById('container'));
    var source = new UISourceLocal(new SampleUI());
    UIRenderingBind(source, render);
}


window['entangui_sample_init'] = InitSample;