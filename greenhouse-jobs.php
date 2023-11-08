<?php

/**
 * Plugin Name: Greenhouse Jobs
 * Description: Allows user to create shortcodes for Greenhouse IO job listing to be rendered on the page.
 * Author: Nathan Turner
 */
 
add_action('admin_menu', 'my_plugin_menu');

add_action( 'wp_enqueue_scripts', 'my_enqueued_assets' );

add_action( 'admin_enqueue_scripts', 'my_enqueued_assets' );


function my_enqueued_assets() {
	wp_enqueue_script( 'jquery', '//code.jquery.com/jquery-3.7.1.min.js' );		
	wp_enqueue_style( 'job-form', plugin_dir_url( __FILE__ ) . 'css/job-form.css' );
	wp_enqueue_style( 'board-style', plugin_dir_url( __FILE__ ) . 'css/board-style.css' );
	wp_enqueue_script( 'multi-select', plugin_dir_url( __FILE__ ) . 'js/multi-select.js', array( 'jquery' ) );
	wp_enqueue_script( 'shortcodes-build', plugin_dir_url( __FILE__ ) . 'js/careers.js', array( 'jquery' ) );
}

function my_plugin_menu() {
	add_menu_page('Greenhouse Jobs Settings', 'Greenhouse Jobs Plugin', 'administrator', 'greenhouse-jobs-settings', 'greenhouse_jobs_settings_page', 'dashicons-admin-generic');	
}

function greenhouse_jobs_settings_page() {
  // 
 ?>
 <h2>Update Greenhouse Jobs Short Code Settings</h2>
 <p style="padding: 10px; font-style: italicize;">Update Settings Here:</p>
<form method="post" action="options.php">
    <?php settings_fields( 'greenhouse-jobs-settings' ); ?>
    <?php do_settings_sections( 'greenhouse-jobs-settings-group' ); ?>
    <table class="form-table" style="width: 70%;">        
        
        <tr valign="top">
        <th scope="row">Job Board Url:</th>
		<td><input type="text" name="job_board_url" value="<?php echo esc_attr( get_option('job_board_url') ); ?>" style="width: 500px"/></td>
		
		</tr>
		
    </table>    
    <?php submit_button(); ?>
	 <p style="padding: 10px; font-style: italicize;">Use shortcode [greenhouse_jobs_listings] to include on pages.</p>
</form>
 <?php
}

add_action( 'admin_init', 'prod_shortcode_settings' );

function prod_shortcode_settings() {
	
	register_setting( 'greenhouse-jobs-settings', 'job_board_url' );
	
	
}

//Add our shortcode
add_shortcode('greenhouse_jobs_listings','jobs_list_shortcode_output');

//perform the shortcode output
function jobs_list_shortcode_output($atts, $content = '', $tag){
	echo '<script>var boardApiUrl = "'.esc_attr( get_option('job_board_url') ).'";</script>';
	
	$html = '<div class="greenhouse-wrapper" id="openings"></div>';
    return $html;
}


