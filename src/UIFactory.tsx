import { UIDrawCmd } from "./UIProtocol";
import { UIDrawCmdBuilder } from "./UIContext";

export class UIDomElement{
    public tag:string;
    public attrs:any;
    public children:(UIDomElement| UIDrawCmd| string)[];
    public text?:string;

    public get id():string|null{
        if(this.attrs == null) return null;
        return this.attrs.id;
    }
}

export class UIFactory{
    public static Fragment = "<></>";
    public static createElement(tagName:string,attributes:any | null, ...children:any[]):UIDomElement | DocumentFragment{
        if (tagName === UIFactory.Fragment) {
            return document.createDocumentFragment();
        }

        let element = new UIDomElement();
        element.tag = tagName;
        element.attrs = attributes;

        if(children!=null && children.length >0){
            let ret = [];
            let strret = [];
            if(UIFactory.parseChildren(children,ret,strret)){
                element.text = strret.join('');
            }
            else{
                element.children = ret;
            }
        }
        return element;
    }

    private static parseChildren(children:any[],ret:any[],strret:string[]):boolean{
        
        let allstr = true;

        if(children == null) return;
        for(let t=0;t<children.length;t++){
            let c = children[t];
            if(c ==null) continue;
            if(Array.isArray(c)){
                allstr = UIFactory.parseChildren(c,ret,strret);
            }
            else{
                
                if(c instanceof UIDrawCmdBuilder){
                    ret.push(c.cmd);
                    c.consumed = true;
                    allstr = false;
                }
                else if(typeof c !== 'string'){
                    ret.push(c);
                    allstr = false;
                }
                else{
                    ret.push(c);
                    if(allstr){
                        strret.push(c);
                    }
                }
            }
        }
        return allstr;
    }
}