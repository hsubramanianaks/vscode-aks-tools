export function parseResource(armId: string): { resourceGroupName: string | undefined; name: string | undefined } {
    // /subscriptions/{subid}/resourcegroups/{group}/providers/.../{name}
    const bits = armId.split("/").filter((bit) => bit.length > 0);
    const resourceGroupName = bits[3];
    const name = bits[bits.length - 1];
    return { resourceGroupName, name };
}

export function parseSubId(armId: string): { subId: string } {
    // /subscriptions/{subid}/resourcegroups/{group}/providers/.../{name}
    const bits = armId.split("/").filter((bit) => bit.length > 0);
    const subId = bits[1];
    return { subId };
}
