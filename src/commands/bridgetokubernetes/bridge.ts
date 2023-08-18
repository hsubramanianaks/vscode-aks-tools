import { IActionContext } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import * as k8s from 'vscode-kubernetes-tools-api';
import { getAksClusterTreeItem, getClusterProperties, getKubeconfigYaml } from '../utils/clusters';
import { failed } from '../utils/errorable';
import { longRunning } from '../utils/host';
import { withOptionalTempFileWithoutFn } from '../utils/tempfile';

export default async function bridgetokubernetes
    (
        _context: IActionContext,
        target: any) {
    vscode.window.showInformationMessage("Launching Bridge To Kubernetes");

    const extension = vscode.extensions.getExtension('mindaro.mindaro');
    if (!extension) {
        vscode.window.showErrorMessage('Bridge to kubernetes extension is not found, please install it');
        return;
    }
    extension.activate().then(() => {
        console.log('Extension activated!');
    });

    // get the cluster name and pass the information.
    const cloudExplorer = await k8s.extension.cloudExplorer.v1;
    const cluster = getAksClusterTreeItem(target, cloudExplorer);

    if (failed(cluster)) {
        vscode.window.showErrorMessage(cluster.error);
        return;
      }

    const properties = await longRunning(`Getting properties for cluster ${cluster.result.name}.`, () => getClusterProperties(cluster.result));
    if (failed(properties)) {
        vscode.window.showErrorMessage(properties.error);
        return undefined;
    }

    const kubeconfig = await longRunning(`Retrieving kubeconfig for cluster ${cluster.result.name}.`, () => getKubeconfigYaml(cluster.result, properties.result));
    if (failed(kubeconfig)) {
        vscode.window.showErrorMessage(kubeconfig.error);
        return undefined;
    }

    // write to temp location and send it to bridge.
    const tempFileName = await withOptionalTempFileWithoutFn(kubeconfig.result, "YAML");

    return await vscode.commands.executeCommand('mindaro.configure', { 'arg1': cluster.result.name, 'arg2': tempFileName });
}