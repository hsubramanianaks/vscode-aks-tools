import * as vscode from "vscode";
import { getReadySessionProvider } from "../../auth/azureAuth";
import { failed } from "../../commands/utils/errorable";
import { getAKSDocsRAGClient } from "./aksDocsRag/client";
import { getKubectlCommandPluginResponse } from "../shared/pluginResponses";
import { AgentRequest, ILocalPluginHandler, LocalPluginArgs, LocalPluginEntry, LocalPluginManifest, ResponseForLanguageModelExtended } from "../../types/@azure/AzureAgent";

const generateKubectlCommandFunctionName = "generate_kubectl_command";

export const generateKubectlCommandPluginManifest: LocalPluginManifest = {
    name: "generateKubectlCommandPlugin",
    version: "1.0.0",
    functions: [
        {
            name: generateKubectlCommandFunctionName,
            parameters: [],
            returnParameter: {
                type: "object",
            },
            willHandleUserResponse: false,
        }
    ]
};

async function handleKubectlCommandGeneration(agentRequest: AgentRequest): Promise<ResponseForLanguageModelExtended> {
    const sessionProvider = await getReadySessionProvider();

    if (failed(sessionProvider)) {
        return { responseForLanguageModel: { text: "Failed to get session provider." } };
    }

    const client = getAKSDocsRAGClient(sessionProvider.result);
    const promptHistory = agentRequest.context.history.filter(c => Object.hasOwn(c, "prompt")) as vscode.ChatRequestTurn[];
    const prompt = promptHistory[promptHistory.length - 1].prompt; // get latest prompt from chat history

    const request = await client.sendRequest({ message: prompt });

    if (failed(request)) {
        return { responseForLanguageModel: { status: "error", text: request.error } };
    }

    const { messageForLanguageModel, buttonLabel, commandID, arguments: returnArgs } = getKubectlCommandPluginResponse(request.result.response);

    return {
        responseForLanguageModel: { messageForLanguageModel },
        chatResponseParts: [
            new vscode.ChatResponseCommandButtonPart({
                title: vscode.l10n.t(buttonLabel),
                command: commandID,
                arguments: returnArgs
            }),
        ]
    };
}



const generateKubectlCommandPluginHandler: ILocalPluginHandler = {
    execute: async (args: LocalPluginArgs) => {
        const pluginRequest = args.localPluginRequest;

        if (pluginRequest.functionName === generateKubectlCommandFunctionName) {
            const { responseForLanguageModel, chatResponseParts } = await handleKubectlCommandGeneration(args.agentRequest);
            return { responseForLanguageModel, chatResponseParts };
        }

        return {
            status: "error",
            message: "Unrecognized command."
        }
    },
};

export const generateKubectlCommandPlugin: LocalPluginEntry = {
    manifest: generateKubectlCommandPluginManifest,
    handler: generateKubectlCommandPluginHandler,
};