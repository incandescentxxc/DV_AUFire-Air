function temp_toggle(){
    $(document).ready(function(event){
        $('form input').click(function(event){
          $('form > div').css('transform', 'translateX('+$(this).data('location')+')');
          $(this).parent().siblings().removeClass('selected');
          $(this).parent().addClass('selected');
        });
      });
}
