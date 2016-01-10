
module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*!\n' +
                ' * JavaScript autoComplete v1.0.3\n' +
                ' * https://github.com/Pixabay/JavaScript-autoComplete\n' +
                ' */',
        clean: {
            files: ['auto-complete.min.js', 'auto-complete.min.js.map']
        },
        uglify: {
            options: {
                banner: '<%= banner %>',
                sourceMap: true,
                preserveComments: 'some'
            },
            dist: {
                src: 'auto-complete.js',
                dest: 'auto-complete.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['jshint', 'clean', 'uglify']);
    grunt.registerTask('build', ['uglify']);
};
