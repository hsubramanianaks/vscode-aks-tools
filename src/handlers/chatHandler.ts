import * as vscode from "vscode";

export interface AksChatResult extends vscode.ChatResult {
    metadata: {
        command: string;
    };
}

const MODEL_SELECTOR: vscode.LanguageModelChatSelector = { vendor: "copilot", family: "gpt-4o" };

export async function chatHandler(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<AksChatResult> {
    let command = request.command;
    const prompt = request.prompt;
    if (!command) {
        if (prompt.includes("kubeconfig")) {
            command = "aks.getKubeconfigYaml";
        }
    }
    const logger = vscode.env.createTelemetryLogger({
        sendEventData(eventName, data) {
            // Capture event telemetry
            console.log(`Event: ${eventName}`);
            console.log(`Data: ${JSON.stringify(data)}`);
        },
        sendErrorData(error, data) {
            // Capture error telemetry
            console.error(`Error: ${error}`);
            console.error(`Data: ${JSON.stringify(data)}`);
        },
    });

    switch (command) {
        case "aks.getKubeconfigYaml":
            stream.progress("Loading ...");
            console.log("history", context.history);
            try {
                const [model] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
                if (!model) {
                    throw new Error("No model found");
                }
                stream.progress("Model found. Loading...");
                const messages = [vscode.LanguageModelChatMessage.User(prompt)];
                const chatResponse = await model.sendRequest(messages, {}, token);
                for await (const fragment of chatResponse.text) {
                    stream.markdown(fragment);
                }
            } catch (error) {
                handleError(logger, error, stream);
            }

            stream.button({
                command: "aks.getKubeconfigYaml",
                title: vscode.l10n.t("get kubeconfig yaml"),
            });

            logger.logUsage("request", { kind: "aks.getKubeconfigYaml" });
            return { metadata: { command: "aks.getKubeconfigYaml" } };
        default:
            throw new Error(`Unknown command: ${command}`);
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function handleError(logger: vscode.TelemetryLogger, err: any, stream: vscode.ChatResponseStream): void {
    // making the chat request might fail because
    // - model does not exist
    // - user consent not given
    // - quote limits exceeded
    logger.logError(err);

    if (err instanceof vscode.LanguageModelError) {
        console.log(err.message, err.code, err.cause);
        if (err.cause instanceof Error && err.cause.message.includes("off_topic")) {
            stream.markdown(vscode.l10n.t("I'm sorry, I can only explain computer science concepts."));
        }
    } else {
        // re-throw other errors so they show up in the UI
        throw err;
    }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
