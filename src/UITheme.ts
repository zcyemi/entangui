import { UIBaseBuilder } from "./UIBuilder";
import { UIEventData } from "./UIProtocol";

export interface IUITheme{
    LoadDepStyleSheet();
    LoadDepScript();
    GetUIBuilder(eventCallback: (evtdata: UIEventData) => void, internalDiv?: HTMLDivElement):UIBaseBuilder;
}


