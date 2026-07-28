export interface NavItem {
  label: string;
  disabled?: boolean;
  iconName?: string;
  route?: string;
  children?: NavItem[];
}
