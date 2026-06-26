import * as lambda from 'aws-cdk-lib/aws-lambda';

/**
 * Docker-bundled Python Lambda code.
 *
 * The original stacks used `lambda.Code.fromAsset(dir)` with no bundling, which
 * zips the source WITHOUT installing dependencies — so fastapi / mangum /
 * aws-lambda-powertools were never present and every Lambda would ImportError
 * on cold start. This helper runs `pip install -r <requirements>` into the
 * asset output inside the official Python build image, then copies the source.
 *
 * Requires the Docker daemon to be running at synth/deploy time.
 *
 * @param path            asset directory (relative to infrastructure/)
 * @param requirements    requirements filename inside that dir (default requirements.txt)
 */
export function bundledPythonCode(path: string, requirements = 'requirements.txt'): lambda.AssetCode {
  return lambda.Code.fromAsset(path, {
    bundling: {
      image: lambda.Runtime.PYTHON_3_11.bundlingImage,
      command: [
        'bash', '-c',
        [
          `if [ -f ${requirements} ]; then pip install -r ${requirements} -t /asset-output; fi`,
          `cp -au . /asset-output`,
        ].join(' && '),
      ],
    },
  });
}
