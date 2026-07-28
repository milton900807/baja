export class IoniScript {
    static POSTJSON(js: { spath: string; rule_name: string; }, get_helm_rule: string) {
        throw new Error("Method not implemented.");
    }
    id: string;
    rule_name: string;
    rule_value: string;
    spath: string;
    rule_type: string;
    input_label: string;
    static http: any;
}