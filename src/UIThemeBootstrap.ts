import { IUITheme } from "./UITheme";
import { UIHTMLDepLoader } from "./UIRender";
import { UIBaseBuilder } from "./UIBuilder";
import { UIVirtualDom } from "./UIVirtualDom";

export class UIThemeBootstrap implements IUITheme{

    public CSS_BOOTSTRAP:string = "https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css";
    public JS_BOOTSTRAP:string = "https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js";

    public JS_POPPER:string  = "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js";

    LoadDepStyleSheet() {
        UIHTMLDepLoader.loadCss(this.CSS_BOOTSTRAP);
    }
    LoadDepScript() {
        UIHTMLDepLoader.loadJs(this.JS_POPPER);
        UIHTMLDepLoader.loadJs(this.JS_BOOTSTRAP);
    }

    GetUIBuilder(eventCallback: (evtdata: import("./UIProtocol").UIEventData) => void,virtualDom:UIVirtualDom): UIBaseBuilder {
        return new UIBaseBuilder(eventCallback,virtualDom);
    }

}