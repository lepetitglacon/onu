export class Utils {

    static sleepSetTimeout_ctrl
    static sleep(ms) {
        clearInterval(Utils.sleepSetTimeout_ctrl);
        return new Promise(resolve => Utils.sleepSetTimeout_ctrl = setTimeout(resolve, ms));
    }

}