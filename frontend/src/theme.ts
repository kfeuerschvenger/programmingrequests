import {
  Button,
  createTheme,
  Modal,
  Notification,
  SegmentedControl,
  Textarea,
  TextInput,
  Tooltip,
  type MantineColorsTuple,
} from '@mantine/core';
import buttonClasses from './theme/Button.module.css';
import inputClasses from './theme/Input.module.css';
import modalClasses from './theme/Modal.module.css';
import notificationClasses from './theme/Notification.module.css';
import segmentedClasses from './theme/SegmentedControl.module.css';
import tooltipClasses from './theme/Tooltip.module.css';

// Each scale is ten steps from the lightest tint to the darkest shade, with the brand colour at index 5 (the primary shade).
// The brass fill takes ink text, and the wax and guild fills take light text: every pair is above 4.5:1.
const brass: MantineColorsTuple = [
  '#FFF8E3',
  '#F5E6C2',
  '#EBD4A0',
  '#E1C27F',
  '#D7B05E',
  '#C8962E',
  '#A67C26',
  '#83611D',
  '#614715',
  '#3F2D0D',
];

const wax: MantineColorsTuple = [
  '#FCEFEC',
  '#EED1CD',
  '#DFB3AF',
  '#D19590',
  '#C27772',
  '#9E2B25',
  '#7C211D',
  '#651B17',
  '#4A1410',
  '#380E0C',
];

const guild: MantineColorsTuple = [
  '#F0F7EC',
  '#D5E2D1',
  '#BACCB5',
  '#9FB79A',
  '#83A17F',
  '#3F6B3A',
  '#32552E',
  '#2A4827',
  '#244021',
  '#172A15',
];

const parchment: MantineColorsTuple = [
  '#FFFCF2',
  '#F9F2DF',
  '#F3E6C8',
  '#D9CCB1',
  '#BEB29A',
  '#A49983',
  '#8A7F6B',
  '#6F6554',
  '#554B3D',
  '#3B3126',
];

// Mantine paints the dark scheme from `dark`: lightest text first, deepest wood last.
const wood: MantineColorsTuple = [
  '#EFE4CC',
  '#D9CBB0',
  '#B9AA8E',
  '#9A8B72',
  '#6E5F4B',
  '#54463A',
  '#43352A',
  '#33261C',
  '#271C14',
  '#1B130D',
];

const HEADING_FONT = "'Cinzel', 'Trajan Pro', Georgia, 'Times New Roman', serif";

export const theme = createTheme({
  primaryColor: 'brass',
  primaryShade: { light: 5, dark: 5 },
  autoContrast: true,
  luminanceThreshold: 0.3,
  black: '#2B2622',
  white: '#FFFAEC',
  colors: { brass, wax, guild, parchment, dark: wood },
  fontFamily: "'Alegreya Sans', 'Segoe UI', system-ui, sans-serif",
  // Alegreya Sans runs small for its size, so the scale starts a little higher.
  fontSizes: { xs: '0.875rem', sm: '1rem', md: '1.0625rem', lg: '1.25rem', xl: '1.5rem' },
  headings: {
    fontFamily: HEADING_FONT,
    fontWeight: '700',
    sizes: {
      h1: { fontSize: 'clamp(1.8rem, 5.2vw, 3rem)', lineHeight: '1.08' },
      h2: { fontSize: 'clamp(1.5rem, 3.6vw, 2.1rem)', lineHeight: '1.15' },
      h3: { fontSize: '1.3rem', lineHeight: '1.25' },
    },
  },
  defaultRadius: 'sm',
  fontWeights: { medium: '500' },
  components: {
    Button: Button.extend({ classNames: buttonClasses }),
    TextInput: TextInput.extend({ classNames: inputClasses }),
    Textarea: Textarea.extend({ classNames: inputClasses }),
    Modal: Modal.extend({ classNames: modalClasses, defaultProps: { centered: true, zIndex: 400 } }),
    // The close button is an icon alone, so it needs a name for a screen reader.
    Notification: Notification.extend({
      classNames: notificationClasses,
      defaultProps: { closeButtonProps: { 'aria-label': 'Dismiss notification' } },
    }),
    SegmentedControl: SegmentedControl.extend({ classNames: segmentedClasses }),
    Tooltip: Tooltip.extend({ classNames: tooltipClasses, defaultProps: { withArrow: true } }),
  },
});
