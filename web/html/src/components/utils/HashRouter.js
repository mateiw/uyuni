// @flow
import * as React from 'react';
import {useState, useEffect} from 'react';

type HashContextType = {
    hash: ?string,
    renderOnlyMatching: boolean,
    matching?: boolean,
    goTo: (string) => void,
    back: () => void
}

export const HashRouterContext = React.createContext<HashContextType>({
        hash: null,
        renderOnlyMatching: true,
        goTo: (hash) => {},
        back: () => {}
    });

const hashUrlRegex = /^#\/(.*)$/;

function hashUrl(): ?string {
    const match = window.location.hash.match(hashUrlRegex);
    return match ? match[1] : undefined;
}

type HashRouterProps = {
    initialPath: string,
    children: React.Node,
    renderOnlyMatching?: boolean
}

const HashRouter = ({initialPath, children, renderOnlyMatching = true}: HashRouterProps) => {
    const [hash, setHash] = useState(initialPath);

    useEffect(() => {
        const hash = hashUrl();
        if (hash) {
            setHash(hash);
        } else {
            goTo(initialPath);
        }
        window.addEventListener("popstate", (event) => {
            setHash(hashUrl())
        });
    }, []);

    const goTo = (hash: string) => {
        history.pushState(null, "", "#/" + hash);
        setHash(hash);
    }

    const back = () => {
        history.back();
    }

    return (
        <HashRouterContext.Provider value={{hash: hash, goTo: goTo, back: back,
            renderOnlyMatching: renderOnlyMatching}}>
            {children}
        </HashRouterContext.Provider>
    );
}

type RouterProps = {
    path: string,
    children: (HashContextType) => React.Node
}

const Route = (props: RouterProps) => {
    return <HashRouterContext.Consumer>
        {context => {
            const matching = props.path === context.hash;
            if (context.renderOnlyMatching) {
                if (matching) {
                    return props.children({matching: true, ...context});
                } else {
                    return null;
                }
            } else {
                return props.children({matching: matching, ...context});
            }
        }}
    </HashRouterContext.Consumer>;
}

export {HashRouter, Route};