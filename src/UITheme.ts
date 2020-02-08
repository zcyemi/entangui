import { UIBaseBuilder } from "./UIBuilder";
import { UIEventData } from "./UIProtocol";
import { UIVirtualDom } from "./UIVirtualDom";

export interface IUITheme{
    LoadDepStyleSheet();
    LoadDepScript();
    GetUIBuilder(eventCallback: (evtdata: UIEventData) => void, virtualDom:UIVirtualDom):UIBaseBuilder;
}


