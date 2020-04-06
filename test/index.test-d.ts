import * as createSnap from '..';
import { expectError } from 'tsd';

expectError(createSnap());
expectError(createSnap({}));

await createSnap({
  src: 'test'
});

expectError(createSnap({
  src: 'test',
  features: {
    nonexistent: true
  }
}));

expectError(createSnap({
  src: 'test',
  features: {
    mpris: true
  }
}));

expectError(createSnap({
  src: 'test',
  grade: 'nonexistent'
}));

await createSnap({
  src: 'test',
  passthruToSnapcraftYaml: 'test'
});
