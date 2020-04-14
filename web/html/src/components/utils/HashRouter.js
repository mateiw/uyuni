// @flow
import * as React from 'react';
import {useState, useEffect} from 'react';

type HashContextType = {
    hash: ?string,
    goTo: (string) => void,
    back: () => void
}

export const HashRouterContext = React.createContext<HashContextType>({
        hash: null,
        goTo: (hash) => {},
        back: () => {}
    });

const hashUrlRegex = /^#\/(.*)$/;

function hashUrl(): ?string {
    const match = window.location.hash.match(hashUrlRegex);
    return match ? match[1] : undefined;
}

// let listenerAdded = false;

type HashRouterProps = {
    initialPath: string,
    children: React.Node
}

const HashRouter = (props: HashRouterProps) => {
    const [hash, setHash] = useState(props.initialPath);

    useEffect(() => {
        goTo(props.initialPath);
        window.addEventListener("popstate", (event) => {
            console.log("popstate");
            console.log(event);
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
        <HashRouterContext.Provider value={{hash: hash, goTo: goTo, back: back}}>
            {props.children}
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
            if (props.path === context.hash) {
                return props.children(context);
            }
            return null;
        }}
    </HashRouterContext.Consumer>;
}

export {HashRouter, Route};