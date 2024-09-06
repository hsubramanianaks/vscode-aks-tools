import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react";
import { ModelDetails } from "../../../src/webview-contract/webviewDefinitions/kaito";

export type KaitoFamilyModelInputProps = {
    modelDetails: ModelDetails[];
};

export function KaitoFamilyModelInput(props: KaitoFamilyModelInputProps) {
    return (
        <div>
            <div>Family Model</div>
            <div>
                The current supported model families with preset configurations are listed below. Each preset model has
                its own hardware requirements in terms of GPU count and GPU memory defined in the respective model.go
                file. Kaito controller performs a validation check of whether the specified SKU and node count are
                sufficient to run the model or not. Select family model:
            </div>
            <div>
                <VSCodeDropdown>
                    {props.modelDetails.map((modelDetail) => (
                        <VSCodeOption key={modelDetail.family}>{modelDetail.family}</VSCodeOption>
                    ))}
                </VSCodeDropdown>
            </div>
        </div>
    );
}
