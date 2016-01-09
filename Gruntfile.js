
module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*!\n' +
                ' * JavaScript autoComplete v1.0.3\n' +
                ' * https://github.com/Pixabay/JavaScript-autoComplete\n' +
                ' */',
        clean: {
            files: ['auto-complete.min.js']
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
        },
        jshint: {
            options: {
                jshintrc: true
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            src: {
                src: ['auto-complete.js']
            },
            test: {
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['jshint', 'clean', 'uglify']);
    grunt.registerTask('build', ['jshint', 'uglify']);
};
