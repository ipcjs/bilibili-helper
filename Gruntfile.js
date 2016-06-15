module.exports = function(grunt){
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                mangle:true,
                sourceMap: false,
                sourceMapName: 'dest/srcmap.map'
            },
            release: {
                files:[{
                    expand:true,
                    cwd: 'src',
                    src: ['**/*.js','!**/*.min.js'],
                    ext: '.min.js',
                    dest: 'dest/'
                }]
            }
        },
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd:'src',
                    src: ['**/**','!**/*.js','**/*.min.js','_locales/**'],
                    dest: 'dest/'
              }]
            }
        },
        compress: {
            main: {
                options: {
                    archive: 'bilibili_helper.zip'
                },
                files: [{
                    expand: true,
                    cwd: 'dest/',
                    src: ['**/*'],
                    dest: '/'
                 }]
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('default', ['uglify:release','copy:main','compress:main']);
    grunt.registerTask('debug', ['uglify:release','copy:main']);
}