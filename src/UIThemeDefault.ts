import { IUITheme } from "./UITheme";
import { UIBaseBuilder } from "./UIBuilder";
import { h, thunk } from 'snabbdom';
import { VNode } from 'snabbdom/vnode';
import { UIEventData, UIDefineData, UIDefineType, UIDrawCmd, UIDrawCmdType } from './UIProtocol';
import toVNode from 'snabbdom/tovnode';
import { appendFile } from 'fs';
import { UIDomElement } from './UIFactory';

const DEFAULT_CSS = `
`;

export class UIThemeDefault implements IUITheme{
    LoadDepStyleSheet() {
    }
    LoadDepScript() {
    }

    GetUIBuilder(eventCallback: (evtdata: UIEventData) => void, internalDiv?: HTMLDivElement):UIBaseBuilder{
        return new UIBuilderDefault(eventCallback,internalDiv);
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
                height: '100vh'
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

        this.cmdBeginGroup();

        let tabroot = h('div', {
            class: this.buildClasses("tabs"),
            props: { id: id},
        }, []);
        this.pushNode(tabroot);
        this.beginChildren();
        tabs.forEach((tabname, t) => {
            var itemid = `${id}-${t}`;
            var funcClick = this.wrapEventDelay(id, 'click', () => {
                return t;
            });
            let tab = h('div', {
                class: t ==0 ? this.buildClasses('tab','active') : this.buildClasses('tab'),
                props: {
                    id: itemid,
                    href: '#',
                },
                on: {
                    click: funcClick
                }
            }, tabname)
            tabroot.children.push(tab);
        });
        this.endChildren();
    }
    

    public cmdFormInput(options:any){
        let label = options.label;
        let id = options.id;
        let type = options.type || 'text';
        let finish = options.finish;
        let text = options.text;

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
                    placeholder: label,
                    value:text,
                    'autocomplete':'off'
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
            style: {
                padding: padding,
            },
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
            }
        });
        this.pushNode(flex);
        this.beginChildren();
    }
}