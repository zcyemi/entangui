import { h, init } from 'snabbdom';
import classModule from 'snabbdom/modules/class';
import eventListenersModule from 'snabbdom/modules/eventlisteners';
import propsModule from 'snabbdom/modules/props';
import styleModule from 'snabbdom/modules/style';
import { toVNode } from 'snabbdom/tovnode';
import { VNode } from 'snabbdom/vnode';

var patchConfig = init([
    propsModule,
    classModule,
    styleModule,
    eventListenersModule,
]);


type Action = (builder:UIContext)=>void;



export class UIBuilder{
    
    private m_rootNode:VNode;

    public get rootNode():VNode{return this.m_rootNode;}

    private m_parentNodeStack:VNode[] = [];
    private m_childrenNodeStack:(VNode|string)[][] = [];

    private curNode:VNode;
    private curPnode:VNode;

    private curChidrenList:(VNode|string)[];


    public constructor(){
        this.resetRootNode();
    }

    public resetRootNode(){
        let node = h("div");
        this.m_rootNode = node;
        this.curNode = node;
    }

    public pushNode(n:VNode){
        this.curNode = n;
        this.pushChildren(n);
    }

    private pushChildren(c:VNode){
        this.curChidrenList.push(c);
    }

    public beginChildren(){
        let pnode = this.curPnode;
        if(pnode !=null){
            this.m_parentNodeStack.push(pnode);
            this.m_childrenNodeStack.push(this.curChidrenList);
        }

        let curnode = this.curNode;

        curnode.children = [];
        this.curChidrenList = curnode.children;
        this.curPnode = this.curNode;
    }

    public endChildren(){

        this.curPnode.children = this.curChidrenList;
        this.curNode = this.curPnode;
        this.curPnode = this.m_parentNodeStack.pop();
        this.curChidrenList = this.m_childrenNodeStack.pop();

    }
}




export abstract class UIContext{
    private m_html:HTMLElement;
    private m_originNode:VNode;
    private m_vnodePrev:VNode;
    private m_vnodeCur:VNode;

    private get node():VNode{
        return this.m_vnodeCur;
    }

    private builder:UIBuilder;


    private m_trigUpdate:boolean = false;

    constructor(){
        this.builder=  new UIBuilder();
        window.requestAnimationFrame(this.OnUpdate.bind(this));
    }

    abstract DrawUI();

    private OnUpdate(){

        if(this.m_trigUpdate){
            this.m_trigUpdate = false;
            this.update();
        }

        window.requestAnimationFrame(this.OnUpdate.bind(this));
    }



    private wrapEvent(f?:Action):()=>void{
        if(f == null) return null;
        var self = this;
        return ()=>{
            f(this);
            self.trigUpdate();
        }
    }

    private trigUpdate(){
        this.m_trigUpdate =true;
    }


    public button(text:string,onclick?:Action){
        let btn = h('button',{on:{}});

        btn.data.on.click = this.wrapEvent(onclick);


        btn.text = text;
        this.builder.pushNode(btn);
    }

    public beginVertical(){

        const builder =this.builder;
        builder.pushNode(h('div'));
        builder.beginChildren();
    }

    public endVertical(){

        const builder = this.builder;
        builder.endChildren();

    }

    // public toggle(text:string,value:boolean){}

    // public alert(text:string){}

    // public label(text:string){};

    // public seperator(){}

    // public beginForm(){}

    // public endForm(){}

    // public inputEmail(lable:string){
    // }


    public update(){
        console.log("update ui");

        this.builder.beginChildren();
        this.DrawUI();
        this.builder.endChildren();

        this.m_vnodePrev = patchConfig(this.m_vnodePrev,this.builder.rootNode);
        this.builder.resetRootNode();

    }

    public patch(html:HTMLElement|null){
        if(html == null) return;

        this.m_html = html;
        this.m_originNode = toVNode(html);
        this.m_vnodePrev = toVNode(html);
    }


}