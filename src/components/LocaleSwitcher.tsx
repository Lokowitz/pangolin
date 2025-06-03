import { useLocale } from "next-intl";
import LocaleSwitcherSelect from './LocaleSwitcherSelect';

export default function LocaleSwitcher() {
  const locale = useLocale();

  return (
    <LocaleSwitcherSelect
      defaultValue={locale}
      items={[
        {
            value: 'en-US',
            label: 'English'
        },
        {
            value: 'fr-FR',
            label: "Français"
        },
        {
            value: 'de-DE',
            label: 'Deutsch'
        },
        {
            value: 'it-IT',
            label: 'Italiano'
        },
        {
            value: 'pl-PL',
            label: 'Polski'
        },
        {
            value: 'pt-PT',
            label: 'Português'
        },
        {
            value: 'tr-TR',
            label: 'Türkçe'
        }
      ]}
    />
  );
}
