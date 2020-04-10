function showDate(){
    var slider = document.getElementById("timeRange");
    var output = document.getElementById("range");
    output.innerHTML = new Date(slider.value*1000).toDateString();
    slider.oninput = function() {
        output.innerHTML = new Date(this.value*1000).toDateString();
    }
}