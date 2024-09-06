import { InitialState, ModelDetails, ProgressEventType } from "../../../src/webview-contract/webviewDefinitions/kaito";
import { WebviewStateUpdater } from "../utilities/state";
import { getWebviewMessageContext } from "../utilities/vscode";

export type EventDef = Record<string, never>;

export enum Stage {
    ShowArchitecture,
    ShowllmModels,
}

export type KaitoState = InitialState & {
    operationDescription: string;
    kaitoInstallStatus: ProgressEventType;
    errors: string | undefined;
    models: ModelDetails[];
    stage: Stage;
};

export const stateUpdater: WebviewStateUpdater<"kaito", EventDef, KaitoState> = {
    createState: (initialState) => ({
        ...initialState,
        operationDescription: "",
        kaitoInstallStatus: ProgressEventType.NotStarted,
        errors: undefined,
        models: [],
        stage: Stage.ShowArchitecture,
    }),
    vscodeMessageHandler: {
        kaitoInstallProgressUpdate: (state, args) => ({
            ...state,
            operationDescription: args.operationDescription,
            kaitoInstallStatus: args.event,
            errors: args.errorMessage,
            models: args.models,
            stage: args.event === ProgressEventType.Success ? Stage.ShowllmModels : state.stage,
        }),
        getLLMModelsResponse: (state, args) => ({
            ...state,
            models: args.models,
        }),
        getWorkspaceResponse: (state, args) => ({
            ...state,
            workspace: args.workspace,
        }),
    },
    eventHandler: {},
};

export const vscode = getWebviewMessageContext<"kaito">({
    installKaitoRequest: null,
    getLLMModelsRequest: null,
    generateWorkspaceRequest: null,
    deployWorkspace: null,
});
