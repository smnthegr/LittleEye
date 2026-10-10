import classes from './brightness-slider.module.css';

type BrightnessSliderProps = { value: number; onValueChange: (value: number) => void };

export function BrightnessSlider({ value, onValueChange }: BrightnessSliderProps) {
  return <input className={classes.slider} type="range" min={0} max={100} step={1}
    style={{ background: `linear-gradient(to right, #C5DDF5 0%, #C5DDF5 ${value}%, #F8F9FC ${value}%, #F8F9FC 100%)` }}
    value={value} aria-label="Brightness (preview)" aria-valuetext={`${value}%`}
    onChange={event => onValueChange(Number(event.target.value))} />;
}
