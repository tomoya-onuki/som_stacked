import dayjs from "dayjs";

export class Data {
    private _date: number;
    private _score: number;
    private _positive: number;
    private _negative: number;
    private _emotion: string[] = [];
    private _tweet: string;

    constructor(_d: number, _s: number, _p: number, _n: number, _e: string[], _t: string) {
        this._date = _d;
        this._score = _s;
        this._positive = _p;
        this._negative = _n;
        this._emotion = _e;
        this._tweet = _t + ' <br> - ' + dayjs(_d).local().format('YYYY-MM-DD HH:mm:ss');
    }

    public get date() {
        return this._date;
    }
    public get score() {
        return this._score;
    }
    public get positive() {
        return this._positive;
    }
    public get negative() {
        return this._negative;
    }
    public get emotion() {
        return this._emotion;
    }
    public get tweet() {
        return this._tweet;
    }
}