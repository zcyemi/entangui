

export class UIFactory{
    public static Fragment = "<></>";

    public static createElement(tagName: string, attributes: any | null, ...children: any[]): Element | DocumentFragment {
        if (tagName === UIFactory.Fragment) {
            return document.createDocumentFragment();
        }

        const element = document.createElement(tagName);
        if (attributes) {
            for (const key of Object.keys(attributes)) {
                const attributeValue = attributes[key];

                if (key === "className") { // JSX does not allow class as a valid name
                    element.setAttribute("class", attributeValue);
                } else if (key.startsWith("on") && typeof attributes[key] === "function") {
                    element.addEventListener(key.substring(2), attributeValue);
                } else {
                    // <input disable />      { disable: true }
                    // <input type="text" />  { type: "text"}
                    if (typeof attributeValue === "boolean" && attributeValue) {
                        element.setAttribute(key, "");
                    } else {
                        element.setAttribute(key, attributeValue);
                    }
                }
            }
        }

        for (const child of children) {
            UIFactory.appendChild(element, child);
        }

        return element;
    }

    public static appendChild(parent: Node, child: any) {
        if (typeof child === "undefined" || child === null) {
            return;
        }

        if (Array.isArray(child)) {
            for (const value of child) {
                UIFactory.appendChild(parent, value);
            }
        } else if (typeof child === "string") {
            parent.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            parent.appendChild(child);
        } else if (typeof child === "boolean") {
            // <>{condition && <a>Display when condition is true</a>}</>
            // if condition is false, the child is a boolean, but we don't want to display anything
        } else {
            parent.appendChild(document.createTextNode(String(child)));
        }
    }
}